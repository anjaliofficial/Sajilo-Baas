jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ accepted: ["ok@example.com"] }),
    })),
  },
}));

describe("Config", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("config/index: should use default values when env is missing", async () => {
    const oldPort = process.env.PORT;
    const oldMongo = process.env.MONGODB_URI;
    const oldJwt = process.env.JWT_SECRET;

    delete process.env.PORT;
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;

    const config = await import("../../../src/config/index");

    expect(config.PORT).toBe(5050);
    expect(config.MONGODB_URI).toContain(
      "mongodb://127.0.0.1:27017/SajiloBaas",
    );
    expect(config.JWT_SECRET).toBe("mero_secret");

    process.env.PORT = oldPort;
    process.env.MONGODB_URI = oldMongo;
    process.env.JWT_SECRET = oldJwt;
  });

  test("config/index: should parse PORT from env", async () => {
    const oldPort = process.env.PORT;
    process.env.PORT = "8088";

    const config = await import("../../../src/config/index");

    expect(config.PORT).toBe(8088);

    process.env.PORT = oldPort;
  });

  test("config/email: sendEmail should call transporter.sendMail", async () => {
    const email = await import("../../../src/config/email");
    const sendMailSpy = jest.spyOn(email.transporter, "sendMail");

    await email.sendEmail("to@example.com", "Subject", "<b>Hello</b>");

    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "to@example.com",
        subject: "Subject",
        html: "<b>Hello</b>",
      }),
    );
  });
});
