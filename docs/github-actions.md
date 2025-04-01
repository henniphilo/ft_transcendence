# github actions

you can insatall the github actions vscode extension in your local machine to test the workflow. Also try to run the compose file locally... it might not work because of the secrets though..

```bash
``` 
docker compose -f docker-compose.ci.yml up -d --build
docker compose logs
```