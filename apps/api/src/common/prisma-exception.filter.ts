import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = 500;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': // unique constraint
        status = 409;
        message = 'A record with this value already exists';
        break;
      case 'P2025': // record not found
        status = 404;
        message = 'Record not found';
        break;
      case 'P2003': // foreign key constraint
        status = 409;
        message = 'This record is linked to other data and cannot be changed or removed';
        break;
    }

    res.status(status).json({ statusCode: status, message });
  }
}