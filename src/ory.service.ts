import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Configuration,
    CreateIdentityBody,
    FrontendApi,
    IdentityApi,
    UpdateIdentityBody,
} from '@ory/client';
import { Repository } from 'typeorm';
import { Role } from './user/entities/role.entity';
import { User } from './user/entities/user.entity';

@Injectable()
export class OryService {
    private frontendApi: FrontendApi;

    private identityApi: IdentityApi;

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {
        const oryConfig = new Configuration({
            basePath: 'https://magical-mayer-vfzudjcc0n.projects.oryapis.com/',
            accessToken: 'ory_pat_jFbQniRXMTop4Xx0JnlsPq6t0agWMtsa',
        });
        this.identityApi = new IdentityApi(oryConfig);
        this.frontendApi = new FrontendApi(oryConfig);
    }

    async createIdentityAndSave(email: string, roleName: string) {
        const createIdentityBody: CreateIdentityBody = {
            traits: {
                email: email,
            },
            schema_id: 'preset://email',
        };

        try {
            await this.identityApi.createIdentity({
                createIdentityBody,
            });

            let role = await this.roleRepository.findOne({
                where: { name: roleName },
            });
            if (!role) {
                role = this.roleRepository.create({ name: roleName });
                await this.roleRepository.save(role);
            }

            const newUser = this.userRepository.create({
                email: email,
                roles: [role],
            });
            await this.userRepository.save(newUser);

            return {
                success: true,
                message: 'User created successfully',
                user: newUser,
            };
        } catch (error) {
            const errorMessage =
                error.response?.data?.error?.message || error.message;
            const errorStatus = error.response?.status || 500;
            const errorReason =
                error.response?.data?.error?.reason || 'Unknown Error';

            console.error(
                `Error creating identity: [Status Code: ${errorStatus}] Reason: ${errorReason}`,
            );

            throw new Error(
                `Error: ${errorMessage}. Reason: ${errorReason}. Status Code: ${errorStatus}`,
            );
        }
    }

    async verifyLogin(flowId: string, email: string, csrfToken: string) {
        try {
            const response = await this.frontendApi.updateLoginFlow({
                flow: flowId,
                updateLoginFlowBody: {
                    method: 'code',
                    identifier: email,
                    csrf_token: csrfToken,
                },
            });

            return response.data.session_token;
        } catch (error) {
            console.error('Error verifying login flow:', error);
            throw new Error('Error verifying login');
        }
    }

    async listIdentities() {
        try {
            const response = await this.identityApi.listIdentities();
            return response.data;
        } catch (error) {
            console.error('Error listing identities:', error);
            throw new Error('Error listing identities');
        }
    }

    async getIdentity(identityId: string) {
        try {
            const response = await this.identityApi.getIdentity({
                id: identityId,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching identity:', error);
            throw new Error('Error fetching identity');
        }
    }

    async assignRole(identityId: string, role: string) {
        const updateIdentityBody: UpdateIdentityBody = {
            metadata_admin: {
                role: role,
            },
            traits: {},
            schema_id: 'default',
            state: 'active',
        };

        try {
            const response = await this.identityApi.updateIdentity({
                id: identityId,
                updateIdentityBody,
            });
            return response.data;
        } catch (error) {
            console.error('Error assigning role:', error);
            throw new Error('Error assigning role');
        }
    }

    async createLoginFlow() {
        try {
            const response = await this.frontendApi.createBrowserLoginFlow();
            return response.data;
        } catch (error) {
            console.error('Error creating login flow:', error);
            throw new Error('Error creating login flow');
        }
    }

    async getLoginFlow(flowId: string) {
        try {
            const response = await this.frontendApi.getLoginFlow({
                id: flowId,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching login flow:', error);
            throw new Error('Error fetching login flow');
        }
    }

    async createRegistrationFlow0(email: string) {
        try {
            const response =
                await this.frontendApi.createBrowserRegistrationFlow();
            const registrationFlowUrl = `https://magical-mayer-vfzudjcc0n.projects.oryapis.com/self-service/registration?flow=${response.data.id}`;

            return {
                registrationFlowUrl,
            };
        } catch (error) {
            console.log('Error creating registration flow:', error);
            throw error;
        }
    }
    async checkIdentityExists0(email: string) {
        try {
            const identities = await this.identityApi.listIdentities();
            return identities.data.some(
                (identity) => identity.traits.email === email,
            );
        } catch (error) {
            console.log('Error checking identities:', error);
            throw new Error('Error checking identities');
        }
    }

    async checkIdentityExists(email: string) {
        const identities = await this.identityApi.listIdentities();
        return identities.data.some(
            (identity) => identity.traits.email === email,
        );
    }

    async checkUserInDatabase(email: string) {
        return await this.userRepository.findOne({ where: { email } });
    }

    async createRegistrationFlow(email: string, role: string) {
        try {
            const userInDb = await this.checkUserInDatabase(email);

            if (userInDb) {
                const loginFlowResponse =
                    await this.frontendApi.createBrowserLoginFlow();
                const loginFlowUrl = `https://magical-mayer-vfzudjcc0n.projects.oryapis.com/self-service/login?flow=${loginFlowResponse.data.id}`;

                return {
                    success: false,
                    message: 'Email exists in DB. Redirecting to login flow.',
                    loginFlowUrl,
                };
            }

            const existsInOry = await this.checkIdentityExists(email);

            if (existsInOry) {
                const loginFlowResponse =
                    await this.frontendApi.createBrowserLoginFlow();
                const loginFlowUrl = `https://magical-mayer-vfzudjcc0n.projects.oryapis.com/self-service/login?flow=${loginFlowResponse.data.id}`;

                return {
                    success: false,
                    message:
                        'Email already exists in Ory. Redirecting to login flow.',
                    loginFlowUrl,
                };
            } else {
                const registrationFlowResponse =
                    await this.frontendApi.createBrowserRegistrationFlow();
                const registrationFlowUrl = `https://magical-mayer-vfzudjcc0n.projects.oryapis.com/self-service/registration?flow=${registrationFlowResponse.data.id}`;

                let userRole = await this.roleRepository.findOne({
                    where: { name: role },
                });
                if (!userRole) {
                    userRole = this.roleRepository.create({ name: role });
                    await this.roleRepository.save(userRole);
                }

                const newUser = this.userRepository.create({
                    email,
                    roles: [userRole],
                });
                await this.userRepository.save(newUser);

                return {
                    success: true,
                    message:
                        'User successfully registered in DB. Redirecting to Ory registration flow.',
                    registrationFlowUrl,
                };
            }
        } catch (error) {
            console.log('Error creating registration flow:', error);
            throw new Error('Error during registration flow');
        }
    }
}
