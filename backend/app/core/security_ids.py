import secrets


def generate_external_id() -> str:
    return "cp-" + secrets.token_hex(8)
