import {v2,macro} from 'cc';
export enum Dir {
    LEFT = 0,
    UP = 1,
    RIGHT = 2,
    DOWN = 3
};

export enum GameMode {
    ONE, MORE
};


export const Globals = {
    BLOCK_SIZE: 8,
    TANK_SIZE: 16,
    MAP_HEIGHT: 208,
    MAP_WIDTH: 208,
    BULLET_SIZE: 4,
    TB_INIT_POWER:0,
    TB_FAST_POWER: 1,
    TB_DOUBLE_POWER: 2,
    TB_STONE_POWER: 3,
    TB_FOREST_POWER: 4,
    ENEMIES_COUNT: 10,
    TANK_MAX_HP: 10,
    ENEMY1: v2(8, 200),
    ENEMY2: v2(104, 200),
    ENEMY3: v2(200, 200),
    PLAYER1: v2(80, 8),
    FENCE_EMPTY: 0,
    FENCE_WALL: 1,
    FENCE_STONE: 2, 
    MAX_LEVEL: 36,

    //USER_SERVER: `ws://${server}:8080/`,
    //LOGIC_SERVER: `ws://${server}:8081/`,

    Z: {
        FOREST: 5,
        TANK: 4,
        BULLET: 3,
        OTHERS: 2,
        ICE: 1,
    },
};
