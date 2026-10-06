import { PaymentMethod } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class OrderLineDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;
}

export class CreateOrderDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  customerName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value))
  @Matches(/^\+?\d{9,15}$/, { message: 'customerPhone must be a valid phone number' })
  customerPhone: string;

  // Required for online payment (PayHere needs it), optional for WhatsApp orders
  @ValidateIf((o: CreateOrderDto) => o.paymentMethod === PaymentMethod.PAYHERE || !!o.customerEmail)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  customerEmail?: string;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(250)
  deliveryAddress: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  deliveryCity: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  notes?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];
}