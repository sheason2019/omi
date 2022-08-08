import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { IOmiErrorConstructProps, OmiError } from "./typings";

const methods = ["Get", "Post", "Put", "Delete", "Patch"] as const;
type Method = typeof methods[number];

type OmiOption = Omit<AxiosRequestConfig, "params">;

// 将可能为函数的option参数转换为Object
const parseOption = (option?: OmiOption | (() => OmiOption)) => {
  if (!option) {
    return {};
  }
  if (typeof option === "object") {
    return option;
  }
  if (typeof option === "function") {
    return option();
  }
};

/**
 *  这个抽象类本质上就是一个请求工厂。
 *  将请求相关的内容完全抽象出来，
 *  它的派生类就无需再在内部为用户定义的各种请求编写自己的实现，
 *  只需要维护一套描述接口的状态就可以向服务器发起各种指定的请求。
 *   */
export abstract class OmiClientBase {
  static defaultAxiosInstance?: AxiosInstance;
  static defaultOption?: OmiOption | (() => OmiOption);

  clientOption?: OmiOption | (() => OmiOption);

  // 获取请求时的Option
  getOption(option?: OmiOption | (() => OmiOption)): OmiOption {
    // 用户直接在方法里声明的Option参数
    const apiOption = parseOption(option);
    // Client的默认Option参数
    const clientOption = parseOption(this.clientOption);
    // 全局的Static Option参数
    const staticOption = parseOption(OmiClientBase.defaultOption);
    // 把以上三个Option按优先级进行合并得到最终的Option，这里使用浅拷贝
    return {
      ...staticOption,
      ...clientOption,
      ...apiOption,
    };
  }

  constructor(host: string, instance?: AxiosInstance) {
    if (host.charAt(host.length - 1) === "/") {
      this.host = host;
    } else {
      this.host = host + "/";
    }
    if (instance) {
      this.axiosInstance = instance;
    } else if (OmiClientBase.defaultAxiosInstance) {
      this.axiosInstance = OmiClientBase.defaultAxiosInstance;
    } else {
      this.axiosInstance = axios.create();
    }
  }

  axiosInstance: AxiosInstance;

  host: string = "/";

  async request<ResponseType extends any>(
    path: string,
    method: Method,
    props: any,
    option?: Omit<AxiosRequestConfig, "params">
  ): Promise<[OmiError, null] | [null, ResponseType]> {
    try {
      const url = this.host + path;
      if (method === "Get") {
        const res = await this.axiosInstance.get<ResponseType>(url, {
          ...this.getOption(option),
          params: props,
        });
        return [null, res.data];
      }
      if (method === "Post") {
        const res = await this.axiosInstance.post<ResponseType>(
          url,
          props,
          this.getOption(option)
        );
        return [null, res.data];
      }
      if (method === "Delete") {
        const res = await this.axiosInstance.delete<ResponseType>(url, {
          ...this.getOption(option),
          params: props,
        });
        return [null, res.data];
      }
      if (method === "Patch") {
        const res = await this.axiosInstance.patch<ResponseType>(
          url,
          props,
          this.getOption(option)
        );
        return [null, res.data];
      }
      if (method === "Put") {
        const res = await this.axiosInstance.put<ResponseType>(
          url,
          props,
          this.getOption(option)
        );
        return [null, res.data];
      }
    } catch (e: any) {
      const err: AxiosError = e;
      const data = err.response?.data as IOmiErrorConstructProps | string;
      if (typeof data === "object") {
        return [
          new OmiError({
            message: data.message,
            code: data.code,
          }),
          null,
        ];
      } else {
        return [
          new OmiError({
            message: data,
            code: -1,
          }),
          null,
        ];
      }
    }
    throw new OmiError({
      message: "未知错误导致的请求发起失败",
      code: -1,
    });
  }
}
