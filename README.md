<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
  <a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
</p>

## Description

This is a NestJS-based authentication and authorization system that integrates with Ory Kratos for identity management. It allows users to sign up, log in, and access protected routes based on their roles (`admin` or `customer`). It also generates JWT tokens after successful login and includes a role-based access control mechanism.

## Features

- **Sign Up**: Users can register by providing an email and selecting a role (`admin` or `customer`).
- **Login**: Users can log in, and the system will redirect them to the Ory Kratos login page.
- **Protected Routes**: Routes are protected using JWT tokens, and access is controlled based on user roles.
- **Role-Based Access Control**: Different routes are accessible based on the user’s role (either `admin` or `customer`).
- **JWT Tokens**: After login, the system generates JWT tokens for session management.
- **Integration with Ory Kratos**: The system uses Ory Kratos for handling identity management.

## Installation

```bash
$ npm install
