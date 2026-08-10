# AMAS

Projeto reorganizado em duas partes:

- `frontend/`: interface web estática
- `backend/`: API Spring Boot e regras de negócio

## Como rodar

### Front-end

```powershell
cd frontend
python -m http.server 5500
```

### Back-end

```powershell
cd backend
.\gradlew.bat bootRun
```

Requer `Java 17` ou superior.

Com isso, o sistema fica disponível com:

- front-end em `http://localhost:5500`
- backend em `http://localhost:8080`
