import datetime
import copy

from celery import shared_task, current_task

from core.llm_processor.openai import OpenAIProcessor, OpenAIEmbedding
from core.component.text import Text
from core.component.prompt import Prompt
from core.component.parser import TagParser
from core.component.chain import Chain
from core.component.table import Table
from core.component.doc_search import DocSearch

from core.doc_search.doc_transformer import TextSplitter
from core.doc_search.vector_store import VectorStoreLanceDB

from connection import db
from model.application import DbAppTask, TaskStatus
from model.types import LlmApiType
from model.file import DbEmbedding
from services.quota_service import QuotaService
from services.user_api_key_service import get_selected_user_api_key_type_or_none

from config import logger


def text_convert(text_template, input_variables=None):
    text_obj = Text(text_template)

    res = text_obj.text_convert(input_variables)

    return res


def tag_parse(tag, text_template, input_variables=None):
    parser_obj = TagParser(tag)
    text_obj = Text(text_template)

    res = parser_obj.parse(text_obj, input_variables)

    return res


def select_llm_processor(model_provider, params_dict, llm_api_key_dict):
    if model_provider == LlmApiType.OPENAI.value:
        if "openai_api_key" not in llm_api_key_dict:
            logger.warning("No openai_api_key provided")
            return None
        params_dict["openai_api_key"] = llm_api_key_dict["openai_api_key"]
        params_dict = OpenAIProcessor.check_params_dict(params_dict)
        return OpenAIProcessor(**params_dict)
    else:
        logger.warning("{} is not supported".format(model_provider))
        return None


def complete(prompt,
             input_variables=None,
             model_provider=LlmApiType.OPENAI.value,
             params_dict=None,
             llm_api_key_dict=None):
    if params_dict is None:
        params_dict = {}

    if llm_api_key_dict is None:
        llm_api_key_dict = {}

    llm_processor = select_llm_processor(
        model_provider, params_dict, llm_api_key_dict)
    if llm_processor is None:
        return None

    prompt_obj = Prompt(llm_processor, prompt)
    res = prompt_obj.complete(input_variables)

    return res


def select_doc_transformer(doc_transformer_type, params_dict):
    if doc_transformer_type == "text_splitter":
        logger.info(params_dict)
        params_dict = TextSplitter.check_params_dict(params_dict)
        logger.info(params_dict)
        return TextSplitter(**params_dict)
    else:
        logger.warning("{} is not supported".format(doc_transformer_type))
        return None


def select_embedding_model(model_provider, params_dict, llm_api_key_dict):
    if model_provider == "openai":
        if "openai_api_key" not in llm_api_key_dict:
            logger.warning("No openai_api_key provided")
            return None
        params_dict["openai_api_key"] = llm_api_key_dict["openai_api_key"]
        params_dict = OpenAIEmbedding.check_params_dict(params_dict)
        return OpenAIEmbedding(**params_dict)
    else:
        logger.warning("{} is not supported".format(model_provider))
        return None


def select_vector_store(vector_store_provider, params_dict):
    if vector_store_provider == "lancedb":
        return VectorStoreLanceDB(**params_dict)
    else:
        logger.warning("{} is not supported".format(vector_store_provider))
        return None


def load_vector_store(embedding_id, llm_api_key_dict):
    embedding_build = DbEmbedding.query.filter(
        DbEmbedding.id == embedding_id).first()

    if embedding_build is None:
        return None

    embedding_config = embedding_build.config
    embedding_model_provider = embedding_config["embedding_model"]["model_provider"]
    embedding_model_params_dict = embedding_config["embedding_model"]["parameters"]

    embedding_model = select_embedding_model(embedding_model_provider, embedding_model_params_dict, llm_api_key_dict)

    if embedding_model is None:
        return None

    vector_store_provider = embedding_config["vector_store"]["vector_store_provider"]
    vector_store_params_dict = embedding_config["vector_store"]["parameters"]

    vector_store_params_dict["embedding_model"] = embedding_model
    vector_store_params_dict["table_name"] = embedding_id
    vector_store_params_dict["mode"] = "read"
    vector_store = select_vector_store(vector_store_provider, vector_store_params_dict)

    if vector_store is None:
        return None

    return vector_store


def load_chain(action_list, llm_api_key_dict=None):
    if llm_api_key_dict is None:
        return None

    try:
        chain_obj = Chain()

        for action in action_list:
            # if action["type"] == "table":
            #     name = action["name"]
            #     is_input = action["is_app_input"]
            #     is_output = action["is_app_output"]
            #
            #     table_obj = Table(action["is_app_output"])
            #     chain_obj.add_table(table_obj, name, is_input=is_input, is_output=is_output)
            if action["type"] == "text":
                text_template = action["input"]
                name = action["name"]
                is_input = action["is_app_input"]
                is_output = action["is_app_output"]

                text_obj = Text(text_template)
                chain_obj.add_text(text_obj, name, is_input, is_output)
            elif action["type"] == "prompt":
                model_provider = action["model_provider"]
                params_dict = action["parameters"]
                prompt_template = action["input"]
                name = action["name"]
                is_input = action["is_app_input"]
                is_output = action["is_app_output"]

                llm_processor = select_llm_processor(
                    model_provider, params_dict, llm_api_key_dict)
                if llm_processor is None:
                    return None

                prompt_obj = Prompt(llm_processor, prompt_template)
                chain_obj.add_prompt(prompt_obj, name, is_input, is_output)
            elif action["type"] == "tag_parser":
                text_template = action["input"]
                tag = action["tag"]
                name = action["name"]
                is_input = action["is_app_input"]
                is_output = action["is_app_output"]

                parser_obj = TagParser(tag)
                text_obj = Text(text_template)

                chain_obj.add_parser(parser_obj, text_obj,
                                     name, is_input, is_output)
            elif action["type"] == "doc_search":
                embedding_id = action["embedding_id"]
                text_template = action["input"]
                params_dict = action["parameters"]
                name = action["name"]
                is_input = action["is_app_input"]
                is_output = action["is_app_output"]

                vector_store = load_vector_store(embedding_id, llm_api_key_dict)

                if vector_store is None:
                    return None

                top_n = params_dict.get("top_n", 3)
                doc_search_obj = DocSearch(vector_store, text_template, top_n)
                chain_obj.add_doc_search(doc_search_obj, name, is_input, is_output)

        return chain_obj
    except Exception as e:
        logger.error(e)
        return None


def run_chain(action_list, input_variables=None, llm_api_key_dict=None):
    chain_obj = load_chain(action_list, llm_api_key_dict=llm_api_key_dict)

    if chain_obj is None:
        return None

    res = chain_obj.run(input_variables)

    return res


class InsufficientQuotaException(Exception):
    pass


@shared_task(ignore_result=True)
def batch_task(action_list, input_variables, table_list, task_name, created_by, created_at, app_id, file_id,
               llm_api_key_dict=None):
    task_id = current_task.request.id
    total = len(table_list)
    res_list = []
    count = 0

    task_build = DbAppTask(id=task_id, task_name=task_name, created_by=created_by,
                           created_at=created_at, app_id=app_id, file_id=file_id, published=False)
    task_build.status = TaskStatus.queued.value
    db.session.add(task_build)
    db.session.commit()

    try:
        chain_obj = load_chain(action_list, llm_api_key_dict=llm_api_key_dict)
    except Exception as e:
        task_build.status = TaskStatus.failed.value
        task_build.message = {"message": "application load failure. " + str(e)}
        task_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return

    if chain_obj is None:
        task_build.status = TaskStatus.failed.value
        task_build.message = {"message": "application load failure"}
        task_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return

    try:
        for table in table_list:

            quota_needed = QuotaService.calculate_app_quota(created_by, action_list)
            current_quota = QuotaService.check_user_quota(created_by)

            if current_quota.get('quota_available') < quota_needed:
                raise InsufficientQuotaException(f"Insufficient quota: required {quota_needed}, available {current_quota.get('quota_available')}")

            current_input_variables = copy.deepcopy(input_variables)
            current_input_variables.update(table)
            res = chain_obj.run(current_input_variables)
            res_list.append(res)
            count += 1

            task_build.status = TaskStatus.running.value
            task_build.result = {"progress": {
                "total": total, "completed": count}, "result": res_list}
            db.session.commit()
            current_task.update_state(state="RUNNING",
                                      meta={"progress": {"total": total, "completed": count}})
            
            QuotaService.update_user_quota(created_by, quota_needed)

        if task_build is None:
            return

        task_build.status = TaskStatus.completed.value
        task_build.completed_at = datetime.datetime.utcnow()
        task_build.result = {"progress": {"total": total,
                                          "completed": count}, "result": res_list}
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        task_build.status = TaskStatus.failed.value

        if isinstance(e, InsufficientQuotaException):
            task_build.message = {"message": str(e)}
        else:
            task_build.message = {"message": str(e)}

        task_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return {"error": str(e)}


def start_batch_task(action_list, input_variables, table_list, task_name, created_by, created_at, app_id, file_id,
                     llm_api_key_dict=None):
    task = batch_task.delay(action_list, input_variables, table_list, task_name,
                            created_by, created_at, app_id, file_id, llm_api_key_dict=llm_api_key_dict)

    if task:
        return task.id
    else:
        return None


@shared_task(ignore_result=True)
def embedding_task(doc_transformer_type, doc_transformer_params_dict, embedding_model_provider,
                   embedding_model_params_dict, vector_store_provider, vector_store_params_dict, text,
                   embedding_name, created_by, file_id, llm_api_key_dict, embedding_config):
    embedding_id = current_task.request.id

    embedding_build = DbEmbedding(id=embedding_id, embedding_name=embedding_name, created_by=created_by,
                                  file_id=file_id, config=embedding_config, published=False)
    embedding_build.status = TaskStatus.queued.value
    db.session.add(embedding_build)
    db.session.commit()

    try:
        doc_transformer = select_doc_transformer(doc_transformer_type, doc_transformer_params_dict)
    except Exception as e:
        embedding_build.status = TaskStatus.failed.value
        embedding_build.message = {"message": "doc_transformer load failure. " + str(e)}
        embedding_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return

    if doc_transformer is None:
        embedding_build.status = TaskStatus.failed.value
        embedding_build.message = {"message": "doc_transformer load failure"}
        embedding_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return

    try:
        embedding_model = select_embedding_model(embedding_model_provider, embedding_model_params_dict, llm_api_key_dict)
    except Exception as e:
        embedding_build.status = TaskStatus.failed.value
        embedding_build.message = {"message": "embedding_model load failure. " + str(e)}
        embedding_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return

    if embedding_model is None:
        embedding_build.status = TaskStatus.failed.value
        embedding_build.message = {"message": "embedding_model load failure"}
        embedding_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return
    try:
        vector_store_params_dict["embedding_model"] = embedding_model
        vector_store_params_dict["table_name"] = embedding_id
        vector_store = select_vector_store(vector_store_provider, vector_store_params_dict)
    except Exception as e:
        embedding_build.status = TaskStatus.failed.value
        embedding_build.message = {"message": "vector_store load failure. " + str(e)}
        embedding_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return

    if vector_store is None:
        embedding_build.status = TaskStatus.failed.value
        embedding_build.message = {"message": "vector_store load failure"}
        embedding_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()
        return

    chunk_list = doc_transformer.split_text(text)

    total = len(chunk_list)
    count = 0

    is_first_or_hundredth_iteration = (count % 100 == 0 or count == 1)
    is_openai_api_key_not_provided = (get_selected_user_api_key_type_or_none("openai", created_by) is None)

    try:
        for chunk in chunk_list:
            vector_store.add_text(chunk)
            count += 1

            if is_first_or_hundredth_iteration and is_openai_api_key_not_provided:
                quota_needed = 1
            else:
                quota_needed = 0
            
            current_quota = QuotaService.check_user_quota(created_by)

            if current_quota.get('quota_available') < quota_needed:
                raise InsufficientQuotaException(f"Insufficient quota: required {quota_needed}, available {current_quota.get('quota_available')}")
            
            embedding_build.status = TaskStatus.running.value
            embedding_build.result = {"progress": {
                "total": total, "completed": count}}
            db.session.commit()
            current_task.update_state(state="RUNNING",
                                    meta={"progress": {"total": total, "completed": count}})
            
            QuotaService.update_user_quota(created_by, quota_needed)

        if embedding_build is None:
            return

        embedding_build.status = TaskStatus.completed.value
        embedding_build.completed_at = datetime.datetime.utcnow()
        embedding_build.result = {"progress": {"total": total,
                                               "completed": count}}
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        embedding_build.status = TaskStatus.failed.value
        if isinstance(e, InsufficientQuotaException):
            embedding_build.message = {"message": str(e)}
        else:
            embedding_build.message = {"message": e}
        embedding_build.completed_at = datetime.datetime.utcnow()
        db.session.commit()


def start_embedding_task(doc_transformer_type, doc_transformer_params_dict, embedding_model_provider,
                         embedding_model_params_dict, vector_store_provider, vector_store_params_dict, text,
                         embedding_name, created_by, file_id, llm_api_key_dict, embedding_config):

    task = embedding_task.delay(doc_transformer_type, doc_transformer_params_dict, embedding_model_provider,
                                embedding_model_params_dict, vector_store_provider, vector_store_params_dict, text,
                                embedding_name, created_by, file_id, llm_api_key_dict, embedding_config)

    if task:
        return task.id
    else:
        return None


def doc_search(embedding_id, text_template, params_dict, llm_api_key_dict, input_variables=None):
    vector_store = load_vector_store(embedding_id, llm_api_key_dict)

    if vector_store is None:
        return None

    top_n = params_dict.get("top_n", 3)

    doc_search_obj = DocSearch(vector_store, text_template, top_n)

    res = doc_search_obj.search(input_variables=input_variables)

    return res


