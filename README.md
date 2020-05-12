# GraphQL example

## DEMO

[https://murmuring-wildwood-45964.herokuapp.com/graphql](https://murmuring-wildwood-45964.herokuapp.com/graphql)

## Usage

### Fetching users

```
query users {
  users(limit: 5, offset: 0) {
    id
    name
    email
    createdAt
  }
}
```

### Retrieve user by id

```
query user {
  user(id: 2) {
    id
    name
    email
    createdAt
  }
}
```

### Updating user record

```
mutation updateUser {
  user(id: 2) {
    update(with: {
      name: "Juan Dela Cruz"
    }) {
      code
      user {
        id
        name
        email
        createdAt
      }
    }
  }
}
```
