# Python 项目识别

结合依赖文件和入口文件判断，不要只凭目录名推断框架。

## FastAPI

- 识别依赖：`fastapi`，通常还包含 `uvicorn`
- 常见入口文件：`main.py`、`app.py`、`src/main.py`、`src/app.py`
- 常见 app 对象：`app = FastAPI()`，或从 `fastapi` import
- `requirements.txt` 判断方式：查找 `fastapi`、`uvicorn`、数据库驱动和环境变量辅助库。
- `pyproject.toml` 判断方式：检查 `[project.dependencies]`、Poetry dependencies 或工具特定依赖区。
- 常见启动命令：`uvicorn main:app --host 0.0.0.0 --port 7860`
- 常见端口：本地常见 `8000`，Hugging Face Spaces 常用 `7860`
- Hugging Face Docker Space 注意事项：必须监听 `0.0.0.0`；使用 Space 期望端口或环境变量端口；确保镜像中安装全部依赖。

如果模块路径不清楚，输出 `uncertain`，并询问入口文件或现有本地运行命令。
