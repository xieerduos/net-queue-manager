const NetQueueManager = require("./net-queue-manager");

function LazyManager(name) {
    this.name = name;
    this.queue = new NetQueueManager(1);
    this.queue.push({
        index: 0,
        meta: { label: "name" },
        fetch: async () => {
            console.log(`Hi I am ${name}`);
        }
    });

    return this;
}

LazyManager.prototype.eat = function (data) {
    this.queue.push({
        meta: { label: "eat" },
        fetch: eatingHandler.bind(this, data)
    });
    return this;
};
LazyManager.prototype.sleep = function (number) {
    this.queue.push({
        meta: { label: "sleep" },
        fetch: sleepHanlder.bind(this, number)
    });
    return this;
};
LazyManager.prototype.sleepFirst = function (number, key) {
    const DEFAULT_UUID = this.queue.DEFAULT_UUID;
    const { caches } = this.queue.data[DEFAULT_UUID];

    let hitIndex = -1;

    caches.forEach((item, curIndex) => {
        if (item.meta && item.meta.label === "sleepFirst") {
            hitIndex = curIndex;
        }
    });

    if (hitIndex === -1) {
        this.queue.pushCachesIndexAfter({
            index: 0,
            meta: { label: "sleepFirst" },
            fetch: sleepFirstHandler.bind(this, number)
        });
    }

    if (hitIndex !== -1) {
        this.queue.pushCachesIndexAfter({
            index: hitIndex + 1,
            meta: { label: "sleepFirst" },
            fetch: sleepFirstHandler.bind(this, number)
        });
    }
    return this;
};
async function eatingHandler(data) {
    console.log(`I am eating ${data}`);
}

async function sleepHanlder(number) {
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, number * 1000);
    });
    console.log(`等待了 ${number} 秒`);
}
async function sleepFirstHandler(number) {
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, number * 1000);
    });
    console.log(`等待了 ${number} 秒`);
}

function LazyMan(name) {
    return new LazyManager(name);
}

LazyMan("Tony")
    .eat("lunch")
    .eat("dinner")
    .sleepFirst(5)
    .sleep(10)
    .sleepFirst(1)
    .eat("junk food");
// Hi I am Tony
// hitIndex :>>  0
// 等待了 5 秒
// 等待了 1 秒
// I am eating lunch
// I am eating dinner
// 等待了 10 秒
// I am eating junk food
