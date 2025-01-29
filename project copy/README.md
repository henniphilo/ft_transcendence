# ft_trainsendence

## Switching to the Beta Branch
```bash
// for the beta_branch
git checkout beta_register_login
```

## Setup (Only Once)
### Steps:
1. Install `virtualenv`:
   ```bash
   python3 -m pip install --user virtualenv
   ```
2. Create and activate the virtual environment:
   ```bash
   python3 -m virtualenv venv
   source venv/bin/activate
   ```
3. Install Django:
   ```bash
   pip install django
   ```

## Running the Project
1. Navigate to the project directories:
   ```bash
   cd myproject
   cd bigproject
   ```
2. Apply migrations:
   ```bash
   python3 manage.py makemigrations
   python3 manage.py migrate
   ```
3. Start the development server:
   ```bash
   python3 manage.py runserver


for olli branch

   python3 -m uvicorn pong_game:app --host 0.0.0.0 --reload

available at http://localhost:8000/
