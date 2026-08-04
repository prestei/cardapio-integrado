import { CashMovementType } from '@prisma/client';
import { cashRepository } from '../repositories/cash.repository.js';
import { AppError } from '../utils/AppError.js';
import { decimalToNumber } from '../utils/serialize.js';
import type {
  CloseCashRegisterInput,
  CreateCashMovementInput,
  ListCashHistoryQuery,
  OpenCashRegisterInput,
} from '../validators/cash.schemas.js';

const OUTFLOW_TYPES: CashMovementType[] = [
  CashMovementType.OUTCOME,
  CashMovementType.BLEED,
  CashMovementType.REFUND,
];

function movementSign(type: CashMovementType): 1 | -1 {
  return OUTFLOW_TYPES.includes(type) ? -1 : 1;
}

export const cashService = {
  async getCurrent(establishmentId: string) {
    return cashRepository.findOpen(establishmentId);
  },

  async open(establishmentId: string, userId: string, input: OpenCashRegisterInput) {
    const existing = await cashRepository.findOpen(establishmentId);
    if (existing) {
      throw new AppError('Já existe um caixa aberto para este estabelecimento.', 409);
    }
    return cashRepository.create(establishmentId, userId, input.openingAmount, input.note);
  },

  async addMovement(
    id: string,
    establishmentId: string,
    userId: string,
    input: CreateCashMovementInput,
  ) {
    const register = await cashRepository.findById(id, establishmentId);
    if (!register) {
      throw new AppError('Caixa não encontrado.', 404);
    }
    if (register.status !== 'OPEN') {
      throw new AppError('Não é possível lançar movimentos em um caixa fechado.', 400);
    }

    return cashRepository.createMovement({
      cashRegisterId: id,
      establishmentId,
      userId,
      type: input.type,
      amount: input.amount,
      reason: input.reason,
      orderId: input.orderId,
    });
  },

  async close(
    id: string,
    establishmentId: string,
    closedById: string,
    input: CloseCashRegisterInput,
  ) {
    const register = await cashRepository.findById(id, establishmentId);
    if (!register) {
      throw new AppError('Caixa não encontrado.', 404);
    }
    if (register.status !== 'OPEN') {
      throw new AppError('Este caixa já foi fechado.', 400);
    }

    const movements = await cashRepository.sumMovements(id);
    const movementsTotal = movements.reduce((sum, m) => {
      const value = decimalToNumber(m.amount) ?? 0;
      return sum + value * movementSign(m.type);
    }, 0);

    const openingAmount = decimalToNumber(register.openingAmount) ?? 0;
    const expectedAmount = Number((openingAmount + movementsTotal).toFixed(2));
    const difference = Number((input.closingAmount - expectedAmount).toFixed(2));

    return cashRepository.close(id, establishmentId, closedById, {
      closingAmount: input.closingAmount,
      expectedAmount,
      difference,
      note: input.note,
    });
  },

  async history(establishmentId: string, query: ListCashHistoryQuery) {
    const [items, total] = await cashRepository.history(establishmentId, query.page, query.pageSize);
    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  },
};
