import { validateBelgianNationalNumber } from "@/helpers/belgian-validator";
import { CodeType, type Transformer } from "./base";

class DataMatrixTransformer implements Transformer {
  codeType(): CodeType {
    return CodeType.NISS;
  }
  identified(raw: string): boolean {
    return /^\d+(?:;\d+){4}$/.test(raw) && raw.split(";")[1].length === 11 && validateBelgianNationalNumber(raw.split(";")[1]).isValid;

  }
  async transform(raw: string): Promise<string> {
    return raw.split(";")[1];
  }

}

export default DataMatrixTransformer;