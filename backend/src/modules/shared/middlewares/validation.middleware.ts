import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      res.locals.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      res.locals.params = schemas.params.parse(req.params);
    }
    next();
  };
}
