import { validateBelgianNationalNumber } from "@/helpers/belgian-validator";
import { CodeType, type Transformer } from "./base";

class Code128Transformer implements Transformer {
  codeType(): CodeType {
    return CodeType.NISS;
  }
  identified(raw: string): boolean {
    return /^(?:\d{11}|\d{20})$/.test(raw) && validateBelgianNationalNumber(raw.replace(/[\s.-]/g, "").substring(0, 11)).isValid;

  }
  async transform(raw: string): Promise<string> {
    return raw.replace(/[\s.-]/g, "").substring(0, 11);
  }

}

export default Code128Transformer;