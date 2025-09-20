# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Package
- `./mvnw compile` - Compile the Java source code
- `./mvnw package` - Build JAR file (includes tests)
- `./mvnw spring-boot:run` - Run the application in development mode
- `./mvnw clean` - Clean build artifacts

### Testing
- `./mvnw test` - Run all tests
- `./mvnw test -Dtest=ClassName` - Run specific test class
- `./mvnw test -Dtest=ClassName#methodName` - Run specific test method

### Database Operations
- Application requires PostgreSQL database running on localhost:5432
- Database name: `ulinda`
- Username: `mydbuser` 
- Database schema is managed via SQL scripts in `src/main/resources/sql/`

## Architecture Overview

This is a Spring Boot application using Spring Data JDBC for data persistence and Spring Security with JWT authentication.

### Key Components

**Entities (`src/main/java/org/ulinda/entities/`)**
- `User` - User accounts with role-based permissions
- `Model` - Dynamic data models that users can create
- `Field` - Fields within models (columns/attributes)
- `UserModelPermission` - Permission system linking users to models
- `ModelLink` - Relationships between different models

**Controllers (`src/main/java/org/ulinda/controllers/`)**
- `AuthController` - Authentication endpoints (login/register)
- `ModelController` - CRUD operations for dynamic models
- `AdminController` - Administrative functions

**Services (`src/main/java/org/ulinda/services/`)**
- `UserService` - User management operations
- `ModelService` - Dynamic model operations
- `StartupService` - Application initialization logic

**Security (`src/main/java/org/ulinda/security/`)**
- JWT-based authentication system
- Role-based access control
- Password encoding with BCrypt

### Frontend
- Static HTML/CSS/JavaScript files in `src/main/resources/html_files/`
- Vanilla JavaScript with modular structure
- Theme system and responsive design

### Configuration
- Database settings in `application.properties`
- JWT secret and expiration configured in properties
- Security configuration in `SecurityConfig.java`

## Development Notes

### Claude Code Instructions
- **IMPORTANT**: Do not run any code, tests, or build commands for this project
- Focus only on making code edits based on requirements
- The application requires full Spring Boot backend and PostgreSQL database setup to run
- Trust that code changes will work based on existing patterns in the codebase

### Database Schema
- Uses UUID primary keys for all entities
- Audit fields (created_at, updated_at) using Spring Data JDBC annotations
- PostgreSQL-specific features utilized

### Security Model
- JWT tokens for stateless authentication
- Permission-based access to models
- Admin users can manage system-wide settings

### Dynamic Model System
- Users can create custom data models at runtime
- Fields have configurable types and validation rules
- Models can be linked to create relationships

### Code Style
- Uses Lombok for reducing boilerplate code
- Spring Data JDBC repositories for data access
- Standard Spring Boot project structure