import fetch from 'node-fetch';

import { USERS_API_URL } from '../config/env';
import { Output } from '../utils/setsTypes';

const SET_URI = `${USERS_API_URL}/user-sets`;

export const getUserSets = async (accessToken: string): Promise<Output[]> => {
    const response = await fetch(encodeURI(SET_URI), {
        method: 'get',
        headers: {
            Authorization: accessToken,
            'Content-Type': 'application/json',
        },
    });

    const body = await response.json();

    if (response.status === 200) {
        return body;
    }

    throw new UserApiError(response.status, body);
};

export const getSet = async (accessToken: string, setId: string): Promise<Output> => {
    const response = await fetch(encodeURI(`${SET_URI}/${setId}`), {
        method: 'get',
        headers: {
            Authorization: accessToken,
            'Content-Type': 'application/json',
        },
    });

    const body = await response.json();

    if (response.status === 200) {
        return body;
    }

    throw new UserApiError(response.status, body);
};

export const getSharedSet = async (accessToken: string, setId: string): Promise<Output> => {
    const uri = `${SET_URI}/shared/${setId}`;

    const response = await fetch(encodeURI(uri), {
        method: 'get',
        headers: {
            Authorization: accessToken,
            'Content-Type': 'application/json',
        },
    });

    const body = await response.json();

    if (response.status === 200) {
        return body;
    }

    throw new UserApiError(response.status, body);
};

export class UserApiError extends Error {
    public readonly status: number;
    public readonly details: unknown;

    constructor(status: number, details: unknown) {
        super(`Users-API returns status ${status}`);
        Object.setPrototypeOf(this, UserApiError.prototype);
        this.name = UserApiError.name;
        this.status = status;
        this.details = details;
    }
}
