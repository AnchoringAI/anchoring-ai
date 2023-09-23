import datetime


def get_future_timestamp(secs=0, mins=0, hours=0, days=0) -> float:
    delta_time = datetime.timedelta(
        days=days, seconds=secs + 60 * mins + 3600 * hours, microseconds=0
    )
    cur_time = datetime.datetime.now() + delta_time  # PyJWT has issue with utc time. use now instead
    return cur_time.timestamp()


def has_passed_timestamp(timestamp: float) -> bool:
    return datetime.datetime.now().timestamp() > timestamp
