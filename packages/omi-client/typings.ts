export abstract class BasicOmiController {
  abstract namespace: string;
}

export interface IOmiErrorConstructProps {
  message: string;
  code: number;
}

export class OmiError extends Error {
  constructor({ message, code }: IOmiErrorConstructProps) {
    super(message);
    this.code = code ?? -1;
  }

  /** 错误码 */
  code: number;
}
