import request from "supertest";
import { Connection, createConnection } from "typeorm";

import { app } from "../../../../app";

let connection: Connection;

describe("Create Statement Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a new deposit statement for a user", async () => {
    await request(app).post("/users").send({
      name: "John Doe",
      email: "johndoe@test.com",
      password: "123456",
    });

    const responseToken = await request(app).post("/sessions").send({
      email: "johndoe@test.com",
      password: "123456",
    });

    const { token } = responseToken.body;

    const responseDeposit = await request(app)
      .post("/statements/deposit")
      .send({
        amount: 300.0,
        description: "Deposit Statement test",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(responseDeposit.status).toBe(201);
    expect(responseDeposit.body).toHaveProperty("id");
  });

  it("should not be able to create a new deposit statement for a non-exists user", async () => {
    const responseDeposit = await request(app)
      .post("/statements/deposit")
      .send({
        amount: 300.0,
        description: "Deposit Statement test",
      });

    expect(responseDeposit.status).toBe(401);
  });

  it("should be able to create a new withdraw statement for a user", async () => {
    await request(app).post("/users").send({
      name: "John Doe",
      email: "johndoe@test.com",
      password: "123456",
    });

    const responseToken = await request(app).post("/sessions").send({
      email: "johndoe@test.com",
      password: "123456",
    });

    const { token } = responseToken.body;

    await request(app)
      .post("/statements/deposit")
      .send({
        amount: 300.0,
        description: "Deposit Statement test",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const responseWithdraw = await request(app)
      .post("/statements/withdraw")
      .send({
        amount: 150.0,
        description: "Withdraw test description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(responseWithdraw.status).toBe(201);
    expect(responseWithdraw.body).toHaveProperty("id");
  });

  it("should not be able to create a new withdraw statement for a non-exists user", async () => {
    const responseWithdraw = await request(app)
      .post("/statements/withdraw")
      .send({
        amount: 150.0,
        description: "Withdraw Statement test",
      });

    expect(responseWithdraw.status).toBe(401);
  });

  it("should not be able to create a new withdraw statement for a user with insufficient funds", async () => {
    await request(app).post("/users").send({
      name: "John Doe",
      email: "johndoe@test.com",
      password: "123456",
    });

    const responseToken = await request(app).post("/sessions").send({
      email: "johndoe@test.com",
      password: "123456",
    });

    const { token } = responseToken.body;

    await request(app)
      .post("/statements/deposit")
      .send({
        amount: 300.0,
        description: "Deposit Statement test",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const responseWithdraw = await request(app)
      .post("/statements/withdraw")
      .send({
        amount: 800.0,
        description: "Withdraw test description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(responseWithdraw.status).toBe(400);
  });
});
