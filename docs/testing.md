# testing

We have integration tests and unit tests in our backend. These are done with pytest.

For example run it like this:
```pytest
docker compose exec backend pytest tests/unit/ -v
```

## Backend Testing Structure:
Create the following structure in your backend service:

```
src/ft_transcendence_backend/
├── tests/
│   ├── conftest.py       # pytest fixtures
│   ├── unit/            # unit tests
│   ├── integration/     # integration tests
│   └── e2e/             # end-to-end tests
```

4. CI/CD Pipeline Features:
- Runs on push to main/develop and PRs
- Separate jobs for testing, building, and deployment
- Automated coverage reporting
- Docker image building and pushing
- Production deployment for main branch

5. Security Considerations:
- Separate test credentials (?)
- Use of GitHub secrets for sensitive data :check:
- No production credentials in test environment 

To implement this:

1. Create `.env.test` file for test environment variables
2. Save the provided Docker Compose test configuration as `docker-compose.test.yml`
3. Save the GitHub workflow as `.github/workflows/ci-cd.yml`
4. Add necessary secrets to your GitHub repository

To run tests locally:
```bash
docker compose -f docker-compose.test.yml up --build
```

## Managing secrets on github
To add the necessary secrets to your GitHub repository, follow these steps:

### Steps to Add Secrets to GitHub Repository

1. **Navigate to Your Repository:**
   - Go to your GitHub repository on the GitHub website.

2. **Go to Settings:**
   - Click on the `Settings` tab at the top of the repository page.

3. **Access Secrets:**
   - In the left sidebar, click on `Secrets and variables` under the `Security` section.
   - Click on `Actions` to manage secrets for GitHub Actions.

4. **Add New Secrets:**
   - Click on the `New repository secret` button.
   - Add the following secrets one by one:

### Example

Here’s how to add a secret:

1. **Click on `New repository secret`.**
2. **Enter the name and value for the secret.**
   - **Name:** `DOCKERHUB_USERNAME`
   - **Value:** `your-dockerhub-username`
3. **Click `Add secret`.**

Repeat these steps for each of the secrets listed above.
