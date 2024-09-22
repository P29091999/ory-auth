import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    SetMetadata,
    UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OryService } from './ory.service';
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly oryService: OryService,
        private readonly jwtService: JwtService,
    ) {}

    @Post('signup')
    async signup(@Body('email') email: string, @Body('role') role: string) {
        try {
            const result = await this.oryService.createIdentityAndSave(
                email,
                role,
            );
            return result;
        } catch (error) {
            console.log('🚀 ~ AuthController ~ signup ~ error:', error);
            return {
                success: false,
                message: error.message,
                code: error?.code,
            };
        }
    }

    @Get('login')
    async initiateLogin() {
        const loginFlow = await this.oryService.createLoginFlow();
        return {
            loginFlowUrl: `https://magical-mayer-vfzudjcc0n.projects.oryapis.com/self-service/login?flow=${loginFlow.id}`,
        };
    }

    @Post('verify-login')
    async verifyLogin(
        @Body('flowId') flowId: string,
        @Body('email') email: string,
        @Body('csrfToken') csrfToken: string,
    ) {
        try {
            await this.oryService.verifyLogin(flowId, email, csrfToken);

            const payload = { email, roles: ['customer'] };
            const jwtToken = this.jwtService.sign(payload);

            return { access_token: jwtToken };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('protected')
    async protectedRoute() {
        return { message: 'This is a protected route' };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @SetMetadata('roles', ['admin'])
    @Get('admin/protected')
    async adminProtectedRoute() {
        return { message: 'This is a protected admin route' };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @SetMetadata('roles', ['customer'])
    @Get('customer/protected')
    async customerProtectedRoute() {
        return { message: 'This is a protected customer route' };
    }

    @Get('login-flow/:flowId')
    async getLoginFlow(@Param('flowId') flowId: string) {
        return this.oryService.getLoginFlow(flowId);
    }

    @Post('register')
    async customRegister(
        @Body('email') email: string,
        @Body('role') role: string,
    ) {
        try {
            const result = await this.oryService.createRegistrationFlow(
                email,
                role,
            );
            if (result.success) {
                return {
                    success: true,
                    message: 'Redirecting to Ory Kratos for registration',
                    registrationFlowUrl: result.registrationFlowUrl,
                };
            } else {
                return {
                    success: false,
                    message: result.message,
                    loginFlowUrl: result.loginFlowUrl,
                };
            }
        } catch (error) {
            console.log('Error during registration:', error);
            return { success: false, message: error.message };
        }
    }
}
