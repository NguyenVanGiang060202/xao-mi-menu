import { formatPrice } from "./menu-data";
import type { Voucher, VoucherDiscount } from "./catalog";

export function voucherDiscountLabel(discount: VoucherDiscount) {
  if (discount.kind === "percent") {
    return discount.maxDiscount
      ? `Giảm ${discount.value}% · tối đa ${formatPrice(discount.maxDiscount)}`
      : `Giảm ${discount.value}%`;
  }
  return `Giảm ${formatPrice(discount.value)}`;
}

export function voucherAmount(voucher: Pick<Voucher, "discount" | "minOrder">, subtotal: number) {
  if (subtotal <= 0 || (voucher.minOrder !== undefined && subtotal < voucher.minOrder)) return 0;
  const { discount } = voucher;
  const amount = discount.kind === "percent"
    ? Math.min(Math.round(subtotal * discount.value / 100), discount.maxDiscount ?? Number.POSITIVE_INFINITY)
    : discount.value;
  return Math.min(Math.max(amount, 0), subtotal);
}

/** Giá trị giảm ước tính để xếp voucher từ giảm nhiều nhất đến ít nhất. */
export function voucherSortValue(voucher: Pick<Voucher, "discount" | "minOrder">) {
  const { discount } = voucher;
  if (discount.kind === "amount") return discount.value;
  const reference = voucher.minOrder && voucher.minOrder > 0 ? voucher.minOrder : 100_000;
  return Math.min(Math.round(reference * discount.value / 100), discount.maxDiscount ?? Number.POSITIVE_INFINITY);
}
