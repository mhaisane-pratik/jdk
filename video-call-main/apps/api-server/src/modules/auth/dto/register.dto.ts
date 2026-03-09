import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}
