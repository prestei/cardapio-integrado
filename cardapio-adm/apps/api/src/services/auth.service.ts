import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { userRepository } from '../repositories/user.repository.js';
import { establishmentRepository } from '../repositories/establishment.repository.js';
import { signToken } from '../middlewares/auth.js';
import { AppError } from '../utils/AppError.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '../validators/auth.schemas.js';

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = slugify(baseName);
  let suffix = 0;

  while (await establishmentRepository.findBySlug(slug)) {
    suffix += 1;
    slug = `${slugify(baseName)}-${suffix}`;
  }

  return slug;
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('E-mail já cadastrado.', 409);
    }

    const slug = await generateUniqueSlug(input.establishmentName);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const establishment = await establishmentRepository.create({
      name: input.establishmentName,
      slug,
      email: input.email,
    });

    const user = await userRepository.create({
      establishmentId: establishment.id,
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'OWNER',
    });

    const token = signToken({
      userId: user.id,
      establishmentId: establishment.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        establishmentId: establishment.id,
        establishment: {
          id: establishment.id,
          name: establishment.name,
          slug: establishment.slug,
          plan: establishment.plan,
          isOpen: establishment.isOpen,
          logoUrl: establishment.logoUrl,
        },
      },
    };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Usuário inativo.', 403);
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const token = signToken({
      userId: user.id,
      establishmentId: user.establishmentId,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        establishmentId: user.establishmentId,
        establishment: {
          id: user.establishment.id,
          name: user.establishment.name,
          slug: user.establishment.slug,
          plan: user.establishment.plan,
          isOpen: user.establishment.isOpen,
          logoUrl: user.establishment.logoUrl,
        },
      },
    };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      establishmentId: user.establishmentId,
      establishment: {
        id: user.establishment.id,
        name: user.establishment.name,
        slug: user.establishment.slug,
        logoUrl: user.establishment.logoUrl,
        isOpen: user.establishment.isOpen,
        plan: user.establishment.plan,
      },
    };
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      return { message: 'Se o e-mail existir, enviaremos instruções de recuperação.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);

    await userRepository.setResetToken(user.id, resetToken, resetTokenExp);

    return {
      message: 'Se o e-mail existir, enviaremos instruções de recuperação.',
      resetToken,
    };
  },

  async resetPassword(input: ResetPasswordInput) {
    const user = await userRepository.findByResetToken(input.token);

    if (!user) {
      throw new AppError('Token inválido ou expirado.', 400);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    await userRepository.updatePassword(user.id, passwordHash);

    return { message: 'Senha redefinida com sucesso.' };
  },
};
