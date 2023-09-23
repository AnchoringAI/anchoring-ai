from connection import r


class TaskRedisRecords:
    def __init__(self, task_id, total=0):
        self.task_id = task_id
        self.redis_name = self._assemble_task_redis_name(task_id)
        if total >= 0:
            self.total = total
            self._create_task_redis_records()

    def _create_task_redis_records(self):
        r.hset(name=self.redis_name, items=[
            {self._total_key(): self.total},
            {self._done_key(): 0},
            {self._fail_key(): 0},
            {self._result_key(): []},
            {self._active_key(): 1},
            {self._fail_key(): []},
        ])

    def get_task_total(self):
        return r.hget(self.redis_name, self._total_key())

    def get_task_progress(self):
        return r.hget(self.redis_name, self._done_key())

    def increase_task_progress(self):
        r.hincrby(self.redis_name, self._done_key())

    def get_task_fail(self):
        return r.hget(self.redis_name, self._fail_key())

    def increase_task_fail(self):
        r.hincrby(self.redis_name, self._fail_key())

    def get_task_result(self):
        return r.hget(self.redis_name, self._result_key())

    def append_result(self, target):
        result = self.get_task_result()
        result.append(target)
        r.hset(self.redis_name, self._result_key(), result)

    def is_active(self):
        return r.hget(self.redis_name, self._active_key()) > 0

    def deactivate(self):
        r.hset(self.redis_name, self._active_key(), 0)

    def get_fail_message(self):
        return r.hget(self.redis_name, self._fail_key())

    def append_fail_message(self, msg):
        messages = self.get_fail_message()
        messages.append(msg)
        r.hset(self.redis_name, self._fail_key(), messages)

    @staticmethod
    def _assemble_task_redis_name(task_id):
        return f"batch-task-{task_id}"

    @staticmethod
    def _total_key():
        return "total"

    @staticmethod
    def _done_key():
        return "done"

    @staticmethod
    def _fail_key():
        return "fail"

    @staticmethod
    def _result_key():
        return "result"

    @staticmethod
    def _active_key():
        return "active"

    @staticmethod
    def _fail_key():
        return "fail"
