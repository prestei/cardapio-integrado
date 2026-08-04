import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/AppError.js';
import type { CreateUserInput, UpdateUserInput } from '../validators/user.schemas.js';

interface CurrentUser {
  userId: string;
  role: UserRole;
}

export const userService = {
  async list(establishmentId: string) {
    return userRepository.findAllByEstablishment(establishmentId);
  },

  async create(establishmentId: string, input: CreateUserInput) {
    const existing = await userRepository.findByEmailAndEstablishment(
      input.email,
      establishmentId,
    );
    if (existing) {
      throw new AppError('Já existe um usuário com este e-mail.', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return userRepository.createTeamMember({
      establishmentId,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      phone: input.phone,
    });
  },

  async update(
    id: string,
    establishmentId: string,
    input: UpdateUserInput,
    currentUser: CurrentUser,
  ) {
    const target = await userRepository.findByIdAndEstablishment(id, establishmentId);
    if (!target) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const isSelf = target.id === currentUser.userId;
    const isDeactivating = input.isActive === false;
    const isDemoting =
      input.role !== undefined && input.role !== UserRole.OWNER && target.role === UserRole.OWNER;

    if (isSelf && target.role === UserRole.OWNER && (isDeactivating || isDemoting)) {
      throw new AppError(
        'Você não pode remover seu próprio acesso de proprietário.',
        400,
      );
    }

    if (target.role === UserRole.OWNER && (isDeactivating || isDemoting)) {
      const activeOwners = await userRepository.countActiveByRole(
        establishmentId,
        UserRole.OWNER,
      );
      if (activeOwners <= 1) {
        throw new AppError(
          'Não é possível remover o único proprietário do estabelecimento.',
          400,
        );
      }
    }

    return userRepository.updateTeamMember(id, establishmentId, {
      ...input,
      avatarUrl: input.avatarUrl === '' ? null : input.avatarUrl,
    });
  },
};
