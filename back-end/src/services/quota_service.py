from model.user import DbUserQuota
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from connection import db
from services.user_api_key_service import get_selected_user_api_key_type_or_none


class QuotaService:

    @staticmethod
    def check_user_quota(user_id):
        user_quota = DbUserQuota.query.filter_by(user_id=user_id).first()
        if user_quota:
            return {"quota_available": user_quota.quota_available, "quota_used": user_quota.quota_used}
        else:
            return {"error": "Quota information not found for the user"}, 404

    @staticmethod
    def update_user_quota(user_id, amount):
        try:
            user_quota = DbUserQuota.query.filter_by(user_id=user_id).first()
            if user_quota:
                user_quota.update_quota(amount)
            else:
                user_quota = DbUserQuota(
                    user_id=user_id, quota_available=100 - amount, quota_used=amount, updated_at=datetime.utcnow())
                db.session.add(user_quota)
            db.session.commit()
            return {"message": "Quota updated successfully"}, 200
        except ValueError as e:
            db.session.rollback()
            return {"error": str(e)}, 403
        except SQLAlchemyError as e:
            db.session.rollback()
            raise

    @staticmethod
    def calculate_app_quota(user_id, data):
        quota_needed = 0
        model_providers = {"openai"}

        for entry in data:
            model_provider = entry.get("model_provider")
            if model_provider in model_providers and get_selected_user_api_key_type_or_none(model_provider, user_id) is None:
                quota_needed += 1
                if entry.get("parameters", {}).get("model_name") == "gpt-4":
                    quota_needed += 4

        return quota_needed

    @staticmethod
    def calculate_model_quota(user_id, data):
        quota_needed = 0
        model_providers = {"openai"}

        model_provider = data.get("model_provider")
        if model_provider in model_providers and get_selected_user_api_key_type_or_none(model_provider, user_id) is None:
            quota_needed += 1
            if data.get("parameters", {}).get("model_name") == "gpt-4":
                quota_needed += 4

        return quota_needed

    # @staticmethod
    # def record_api_usage(user_id, api_name):
    #     try:
    #         new_api_usage_record = ApiUsage(user_id=user_id, api_name=api_name, timestamp=datetime.utcnow())
    #         db.session.add(new_api_usage_record)
    #         db.session.commit()
    #         return {"message": "API usage recorded successfully"}
    #     except SQLAlchemyError as e:
    #         db.session.rollback()
    #         return {"error": str(e)}
