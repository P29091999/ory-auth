import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityApi } from '@ory/client';
import { join } from 'path';
import { AuthController } from './auth.controller';
import { OryService } from './ory.service';
import { Role } from './user/entities/role.entity';
import { User } from './user/entities/user.entity';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
        }),
        PassportModule,
        JwtModule.register({
            secret: 'authz-sol',
            signOptions: { expiresIn: '1h' },
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'Pulkit@123',
            database: 'authz_db',
            entities: [User, Role],
            synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Role]),
    ],
    controllers: [AuthController],
    providers: [OryService, IdentityApi],
})
export class AppModule {}
