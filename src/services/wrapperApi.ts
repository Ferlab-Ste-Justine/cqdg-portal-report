import fetch from 'node-fetch';

import { WRAPPER_API_URL } from '../config/env';
import { Output } from '../utils/setsTypes';

export const getExtendedMapping = async (accessToken: string, index: string): Promise<Output[]> => {
    const URL = `${WRAPPER_API_URL}/extendedMapping/${index}`;
    const response = await fetch(encodeURI(URL), {
        method: 'get',
        headers: {
            Authorization: accessToken,
            'Content-Type': 'application/json',
        },
    });
    const body = await response.json();

    if (response.status === 200) {
        return body.extendedMapping;
    }

    throw new WrapperApiError(response.status, body);
};

export class WrapperApiError extends Error {
    public readonly status: number;
    public readonly details: unknown;

    constructor(status: number, details: unknown) {
        super(`WRAPPER-API returns status ${status}`);
        Object.setPrototypeOf(this, WrapperApiError.prototype);
        this.name = WrapperApiError.name;
        this.status = status;
        this.details = details;
    }
}
