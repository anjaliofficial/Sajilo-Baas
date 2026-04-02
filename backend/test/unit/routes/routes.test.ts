jest.mock("../../../src/controllers/auth.controller", () => ({
  AuthController: jest.fn().mockImplementation(() => ({
    googleLogin: jest.fn(),
  })),
}));

jest.mock("../../../src/controllers/host/listing.controller", () => ({
  createListing: jest.fn(),
  getListingById: jest.fn(),
  getListings: jest.fn(),
  getLocationSuggestions: jest.fn(),
  getMyListings: jest.fn(),
  updateListing: jest.fn(),
  deleteListing: jest.fn(),
}));

jest.mock("../../../src/middlewares/auth.middleware", () => ({
  authorizedMiddleware: jest.fn((req, _res, next) => next()),
}));

jest.mock("../../../src/middlewares/upload", () => ({
  __esModule: true,
  default: {
    array: jest.fn(() => (req: any, _res: any, next: any) => next()),
  },
}));

import authRouter from "../../../src/routes/auth.routes";
import listingRouter from "../../../src/routes/listing/listing.routes";

const getRouteSignatures = (router: any) =>
  router.stack
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
    }));

describe("Routes", () => {
  test("auth.routes: should register POST /google/login", () => {
    const routes = getRouteSignatures(authRouter as any);

    expect(routes).toContainEqual({
      path: "/google/login",
      methods: ["post"],
    });
  });

  test("listing.routes: should include public GET endpoints", () => {
    const routes = getRouteSignatures(listingRouter as any);

    expect(routes).toContainEqual({ path: "/", methods: ["get"] });
    expect(routes).toContainEqual({ path: "/:id", methods: ["get"] });
  });

  test("listing.routes: should include protected write endpoints", () => {
    const routes = getRouteSignatures(listingRouter as any);

    expect(routes).toContainEqual({ path: "/", methods: ["post"] });
    expect(routes).toContainEqual({ path: "/:id", methods: ["put"] });
    expect(routes).toContainEqual({ path: "/:id", methods: ["delete"] });
  });

  test("listing.routes: should include GET /my endpoint", () => {
    const routes = getRouteSignatures(listingRouter as any);

    expect(routes).toContainEqual({ path: "/my", methods: ["get"] });
  });
});
