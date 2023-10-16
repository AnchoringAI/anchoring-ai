"""Timestamp util."""
import datetime


def get_future_timestamp(secs=0, mins=0, hours=0, days=0) -> float:
    """Get future timestamp."""
    delta_time = datetime.timedelta(
        days=days, seconds=secs + 60 * mins + 3600 * hours, microseconds=0
    )
    # PyJWT has issue with utc time. use now instead
    cur_time = datetime.datetime.now() + delta_time
    return cur_time.timestamp()


def has_passed_timestamp(timestamp: float) -> bool:
    """Whether it has passed a certain timestamp now."""
    return datetime.datetime.now().timestamp() > timestamp
