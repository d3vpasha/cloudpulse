from typing import Type
from app.services.checks.base import BaseCheck

_REGISTRY: dict[str, Type[BaseCheck]] = {}


def register_check(cls: Type[BaseCheck]) -> Type[BaseCheck]:
    _REGISTRY[cls.check_type] = cls
    return cls


def get_all_checks() -> list[Type[BaseCheck]]:
    return list(_REGISTRY.values())


def get_check(check_type: str) -> Type[BaseCheck] | None:
    return _REGISTRY.get(check_type)
