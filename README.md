# AMAS

Sistema desenvolvido para gestão e acesso ao ambiente AMAS, composto por:

- frontend estático em HTML/CSS/JS
- backend em Spring Boot
- banco de dados MySQL em Docker
- aplicativo React/Expo para interface adicional

## Pré-requisitos

- Java 17
- Docker Desktop instalado e em execução
- Python 3
- Node.js + npm
- MySQL client opcional para testes manuais

---

## 1. Criar o banco de dados

```sql
CREATE DATABASE IF NOT EXISTS amas_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE amas_db;
SHOW TABLES;
```

---

## 2. Instalar o JDK 17

Opção recomendada: instalar em uma pasta do usuário.

```powershell
$env:JAVA_HOME = "C:\Users\SeuNome\Downloads\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

> Ajuste o caminho conforme o diretório em que o JDK foi extraído.

---

## 3. Subir o banco no Docker

```powershell
cd "C:\Users\Emanuel58152706\Downloads\sistema-amas-main (2) 1\sistema-amas-main"
docker compose up -d
docker ps
docker exec -it meu-mysql mysql -uroot -proot -e "SHOW DATABASES;"
```

Se o container estiver ativo corretamente, o banco `amas_db` deve aparecer na lista.

---

## 4. Executar o backend

```powershell
cd "C:\Users\Emanuel58152706\Downloads\sistema-amas-main (2) 1\sistema-amas-main\backend"
$env:JAVA_HOME = "C:\Users\Emanuel58152706\Downloads\jdk-17.0.20+8"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
./gradlew bootRun --no-daemon
```

A API ficará disponível em:

```text
http://localhost:8080
```

---

## 5. Executar o frontend estático

```powershell
cd "C:\Users\Emanuel58152706\Downloads\sistema-amas-main (2) 1\sistema-amas-main\frontend"
python -m http.server 5500
```

Abra no navegador:

```text
http://localhost:5500
```

---

## 6. Executar o app React/Expo

```powershell
cd "C:\Users\Emanuel58152706\Downloads\sistema-amas-main (2) 1\sistema-amas-main\AMAS-REACT"
npm install
npm run web
```

Ou, em alternativa:

```powershell
npx expo start --web
```

---

## Endereços de acesso

- Backend: http://localhost:8080
- Frontend estático: http://localhost:5500
- Banco MySQL: localhost:3306
- Banco principal: `amas_db`

---

## Observação final

Para que a aplicação funcione corretamente, o banco MySQL deve estar em execução no Docker e o ambiente Java deve estar configurado com JDK 17 antes da inicialização do backend.
