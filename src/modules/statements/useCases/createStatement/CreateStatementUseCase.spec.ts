import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Create Statement', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository,
      inMemoryStatementsRepository);
  })
  it("should be able to create statement", async () => {
    const userCreated = await createUserUseCase.execute({
      name: "User Name",
      email: "user@mail.com",
      password: "password"
    })
    const statementOperation = await createStatementUseCase.execute({
      user_id: userCreated.id,
      type: 'deposit' as OperationType,
      amount: 1000,
      description: "deposit money"
    })
    expect(statementOperation).toHaveProperty("id");
  })
  it("should not be able to create statement with non-existent user", async () => {
    let error: any;

    try {
      await createStatementUseCase.execute({
        user_id: "non-existent id",
        type: 'deposit' as OperationType,
        amount: 1000,
        description: "deposit money"
      })
    } catch (e) {
      error = e;
    }

    expect(error).toEqual(new AppError('User not found', 404));
  });

  it("should not be able to create withdraw statement with insufficient funds", async () => {
    let error: any;

    try {
      const userCreated = await createUserUseCase.execute({
        name: "User Name",
        email: "user@mail.com",
        password: "password"
      });

      await createStatementUseCase.execute({
        user_id: userCreated.id,
        type: 'withdraw' as OperationType,
        amount: 1000,
        description: "deposit money"
      })
    } catch (e) {
      error = e;
    }

    expect(error).toEqual(new AppError('Insufficient funds', 400));
  });
})
