import { formatPrice } from "./menu-data";
import type { VoucherDiscount } from "./catalog";

export function voucherDiscountLabel(discount: VoucherDiscount) {
  if (discount.kind === "percent") {
    return discount.maxDiscount
      ? `Giảm ${discount.value}% · tối đa ${formatPrice(discount.maxDiscount)}`
      : `Giảm ${discount.value}%`;
  }
  return `Giảm ${formatPrice(discount.value)}`;
}
