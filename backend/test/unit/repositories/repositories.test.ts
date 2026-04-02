const mockSave = jest.fn();

jest.mock("../../../src/models/user.model", () => {
  const UserModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));

  (UserModel as any).findOne = jest.fn();
  (UserModel as any).findByIdAndUpdate = jest.fn();
  (UserModel as any).findByIdAndDelete = jest.fn();

  return { UserModel };
});

import { UserRepository } from "../../../src/repositories/user.repository";
import { UserModel } from "../../../src/models/user.model";

describe("Repositories (UserRepository)", () => {
  let repository: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
  });

  test("createUser: should create and save new user", async () => {
    const payload = { email: "test@example.com", fullName: "Test User" } as any;
    const saved = { _id: "u1", ...payload };
    mockSave.mockResolvedValue(saved);

    const result = await repository.createUser(payload);

    expect(UserModel).toHaveBeenCalledWith(payload);
    expect(mockSave).toHaveBeenCalled();
    expect(result).toEqual(saved);
  });

  test("getUserByEmail: should query by email", async () => {
    const user = { _id: "u1", email: "test@example.com" };
    (UserModel.findOne as jest.Mock).mockResolvedValue(user);

    const result = await repository.getUserByEmail("test@example.com");

    expect(UserModel.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });
    expect(result).toEqual(user);
  });

  test("updateUser: should call findByIdAndUpdate with {new:true}", async () => {
    const updated = { _id: "u1", fullName: "Updated" };
    (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

    const result = await repository.updateUser("u1", {
      fullName: "Updated",
    } as any);

    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "u1",
      { fullName: "Updated" },
      { new: true },
    );
    expect(result).toEqual(updated);
  });

  test("deleteUser: should return false when user does not exist", async () => {
    (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    const result = await repository.deleteUser("missing");

    expect(UserModel.findByIdAndDelete).toHaveBeenCalledWith("missing");
    expect(result).toBe(false);
  });
});
