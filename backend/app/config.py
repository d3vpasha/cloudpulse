from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    cors_origins: str = "http://localhost:5173"
    database_path: str = "cloudpulse.db"
    aws_region: str = "us-east-1"
    saas_aws_account_id: str | None = None
    saas_aws_principal_arn: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.database_path}"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def is_saas_mode(self) -> bool:
        return bool(self.saas_aws_account_id and self.saas_aws_principal_arn)


settings = Settings()
