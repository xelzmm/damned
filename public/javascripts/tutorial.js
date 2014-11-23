/**
 * Created by xelz on 14-11-22.
 */
var MockSocket = function() {};
MockSocket.prototype = {
    on: function (name, fn) {
        if (!this.$events) {
            this.$events = {};
        }
        if (!this.$events[name]) {
            this.$events[name] = fn;
        } else if (Object.prototype.toString.call(this.$events[name]) === '[Object Array]') {
            this.$events[name].push(fn);
        } else {
            this.$events[name] = [this.$events[name], fn];
        }
        return this;
    },
    mockEvent: function (name) {
        if (!this.$events) {
            return false;
        }
        var handler = this.$events[name];
        if (!handler) {
            return false;
        }
        var args = [].slice.call(arguments, 1);
        if ('function' == typeof handler) {
            handler.apply(this, args);
        } else if (Object.prototype.toString.call(handler) === '[Object Array]') {
            var listeners = handler.slice();
            for (var i = 0, l = listeners.length; i < l; i++) {
                listeners[i].apply(this, args);
            }
        } else {
            return false;
        }
        return true;
    },
    emit: function(name) {
        if(name == 'name') {
            this.name = arguments[1];
            socket.mockEvent('room', 0, [
                {clientId: '1', name: '司机', ready: true},
                {clientId: '2', name: '演员', ready: true},
                {clientId: '3', name: '商人', ready: true},
                {clientId: '4', name: '医生', ready: true},
                {clientId: '5', name: '律师', ready: true}
            ], false);
            socket.mockEvent('join', {name: socket.name, clientId: '6', mode: 'play'});
        } else if(name == 'ready') {
            startTutorial();
        }
    }
};
var io = function() {
    var socket = new MockSocket;
    socket.on('think', function(content) {
        print("你在想：" + content, 'hint', true);
    });
    socket.on('notice', function(content) {
        print("提示：" + content, 'tips', true);
    });
    socket.on('challenge', function(data) {

    });
    return socket;
};
var scripts = [
    // R1 speak
    [3, ['update', {"round":1,"stage":"speak","room":null,"player":null,"time":3,"bomb":0}]],
    [5, ['notice', "发言顺序为从大厅(0号房间)内的玩家开始，然后是1号房间，2号房间...12号房间 依次发言。"]],
    [6, ['notice', "同一房间内有多个玩家，根据密室法则，房间标记为【S】(small) 的按照玩家号码 “从小到大” 的顺序发言，【L】(large) 反之。"]],
    [1, ['update', {"round":1,"stage":"speak","room":0,"player":0,"time":70,"bomb":0}]],
    [8, ['notice', "你的身份是受害者，你的目标是：通过获取线索，找出唯一的安全房间，解毒后从安全房间逃出密室。密室中的所有房间都有神奇的功能，等着你去探索！"]],
    [10, ['think', "由于我是1号，我的号码在【S】房间里面的效果最好，所以我去4号S房间，既可以拿线索，又可以获得钥匙，其它人就算过来也是有S房优势的我获得线索。"]],
    [3, ['speak', {player: 1, content: "我是一个受害者, 我要找出奸徒并到达安全房间，请大家相信我的身份。"}]],
    [8, ['speak', {player: 1, content: "这回合我要到4号线索房间里去找出线索，并且拿到房间里面的锁匙，请大家不要来争夺，拿到锁匙的下一回合我将去解锁7号房间。"}]],
    [1, ['update', {"round":1,"stage":"speak","room":0,"player":1,"time":70,"bomb":0}]],
    [3, ['speak', {player: 2, content: "房间里有炸弹太危险了,我要去拆除它！"}]],
    [1, ['update', {"round":1,"stage":"speak","room":0,"player":2,"time":70,"bomb":0}]],
    [8, ['speak', {player: 3, content: "我不相信1号，1号的优势太大的了, 但他要去抢锁匙的话我也无法阻止他, 但我可以去监控他获得的线索卡内容!  "}]],
    [3, ['think', "3号玩家不信任自己。"]],
    [2, ['speak', {player: 3, content: "我要移动到5号房间去监视他! "}]],
    [1, ['update', {"round":1,"stage":"speak","room":0,"player":3,"time":70,"bomb":0}]],
    [3, ['speak', {player: 4, content: "这里到处都上锁了我什么地方都不能去! "}]],
    [5, ['speak', {player: 4, content: "1号不如你不要去4号房间了，让给我去拿线索好不好呀？ "}]],
    [3, ['speak', {player: 4, content: "我想我还是去拆炸弹好了~！ "}]],
    [3, ['think', "4号玩家到底是什么人呢?"]],
    [1, ['update', {"round":1,"stage":"speak","room":0,"player":4,"time":70,"bomb":0}]],
    [3, ['speak', {player: 5, content: "... ,我什么都不知道我要听下大家的发言才能决定我的行动。"}]],
    [1, ['update', {"round":1,"stage":"speak","room":0,"player":5,"time":70,"bomb":0}]],
    [3, ['speak', {player: 6, content: "2号你要去拆弹吗? 那你到哪一个房间里呢?"}]],
    [5, ['notice', "游戏过程中，所有玩家按照顺序发言，无法交谈、问答。2号玩家此时无法回应6号玩家，也禁止一切形式的场外交流。"]],
    [5, ['speak', {player: 6, content: "那我去6号L拆弹房间, 2号你去3号S拆弹房间吧,那么那里的锁匙就是你的了。"}]],
    // R1 move
    [3, ['update', {"round":1,"stage":"move","room":null,"player":null,"time":3,"bomb":0}]],
    [2, ['notice', "移动顺序与发言顺序一样，同样遵循密室法则。"]],
    [8, ['notice', "进入有共同边的相邻房间视为走1步，一次移动可以走1~2步，没有锁的情况下【大厅】可以到达任何房间。"]],
    [3, ['move', {player: 1, movements: [{to: 3}, {to: 4}]}]],
    [3, ['move', {player: 2, movements: [{to: 3}]}]],
    [3, ['move', {player: 3, movements: [{to: 6}, {to: 5}]}]],
    [1, ['move', {player: 4, movements: [{}]}]],
    [3, ['think', "4号这家伙不是说去拆弹房间吗？"]],
    [5, ['notice', "允许玩家言行不一。移动阶段必须走出所在房间，但【大厅】例外，允许无条件停留。"]],
    [3, ['move', {player: 5, movements: [{}]}]],
    [3, ['move', {player: 6, movements: [{to: 6}]}]],
    // R2 time
    [3, ['update', {"round":2,"stage":"time","room":null,"player":null,"time":3,"bomb":0}]],
    // R2 perform
    [3, ['update', {"round":2,"stage":"perform","room":null,"player":null,"time":3,"bomb":0}]],
    [10, ['notice', "房间功能的执行，也是按照密室法则，但是一个房间内只有1名玩家可以执行房间功能，【S】房间就是房间内号码最小的玩家获得执行权，【L】反之。"]],
    [8, ['notice', "一般情况下，【大厅】是没有功能的，因此直接跳过。 【1】号房间及【2】号房间里面没有玩家，因此也直接跳过。"]],
    [3, ['key', {type: 'gain', player: 2}]],
    [3, ['challenge', {participants: [2,6], question: 'action', options: {masterPlayer: 2, actionType: 'disarm'}, time: 15}]],
    [3, ['notice', "拆弹需要两个拆弹房间都有人，且总人数满足一定条件，才可以发起。"]],
    [5, ['notice', "游戏总人数不同，拆弹需要的人数也不同，游戏区右下角的拆弹面板会有具体人数的提示。"]],
    [3, ['notice', "成功拆弹两次，游戏将增加一回合。"]],
    [3, ['action', {type: 'disarm', result: true, bomb: 1}]],
    [3, ['key', {type: 'gain', player: 1}]],
    [1, ['update', {"round":2,"stage":"perform","room":4,"player":0,"time":1,"bomb":1}]],
    [1, ['clue', {player: 1, type: 'gain', clue: {level: 1}}]],
    [1, ['clue', {type: 'receive', clue: {level: 1, room: 3}}]],
    [3, ['notice', "你获得的线索，将会直接标记在自己的线索区(游戏地图上方)。"]],
    [1, ['update', {"round":2,"stage":"perform","room":5,"player":0,"time":15,"bomb":1}]],
    [5, ['challenge', {question: 'watch', player: 3, time: 15}]],
    [3, ['clue', {type: 'watch', player: 3, target: 1}]],
    [3, ['key', {type: 'gain', player: 6}]],
    [3, ['skip', {player: 6, reason: 'second-disarm-room'}]],
    // R2 thinking
    [15, ['update', {"round":2,"stage":"thinking","room":null,"player":null,"time":15,"bomb":1}]],
    // R2 speak
    [3, ['update', {"round":2,"stage":"speak","room":null,"player":null,"time":3,"bomb":1}]],
    [1, ['update', {"round":2,"stage":"speak","room":0,"player":0,"time":80,"bomb":1}]],
    [3, ['notice', "每回合增加10秒发言时间。"]],
    [3, ['speak', {player: 4, content: "刚才我听到6号要去拆弹,于是我就没去了, 因为我要是去拆弹的话主要我是想拿到钥匙。"}]],
    [3, ['speak', {player: 4, content: "我如果刚才到6号L房间的话我的号码比不上6号大, 所以我在最后移动的时候选择留在大厅观察情况"}]],
    [3, ['speak', {player: 4, content: "这回合我可以首先移动, 我想我会去拿线索。"}]],
    [1, ['update', {"round":2,"stage":"speak","room":0,"player":1,"time":80,"bomb":1}]],
    [5, ['speak', {player: 5, content: "我的想法和6号差不多,现在拆了一次弹,不如我们再去拆另外一次吧, 这样子我们就有多一回合的逃生时间了。"}]],
    [3, ['speak', {player: 5, content: "其它什么的，我是好人，我听你们的安排吧。"}]],
    [1, ['update', {"round":2,"stage":"speak","room":3,"player":0,"time":80,"bomb":1}]],
    [10, ['speak', {player: 2, content: "我和1号玩家都有锁匙，我想我们应该利用时间差，尽快解开关键的线索和治疗房间，我一会儿会移动到7号房间解锁，然后1号你就可以移动2步到8号治疗房间解锁，同时也可以治疗自己。"}]],
    [1, ['update', {"round":2,"stage":"speak","room":4,"player":0,"time":80,"bomb":1}]],
    [2, ['speak', {player: 1, content: "我同意2号的说法，这样子我们就可以多获得线索的同时解毒了。"}]],
    [3, ['speak', {player: 1, content: "2号提出了这个优质的方案，我想他应该是好人。"}]],
    [3, ['speak', {player: 1, content: "另外3号跑进监控房间看我了我线索，是出于对我的不信任吗？"}]],
    [5, ['speak', {player: 1, content: "我刚才拿到的线索卡内容是【3】号房间是最终危险的! 我一会就会去解锁帮助大家。"}]],
    [3, ['think', "如果2号不去解开7号房间的话那我就去解。"]],
    [1, ['update', {"round":2,"stage":"speak","room":5,"player":0,"time":80,"bomb":1}]],
    [6, ['speak', {player: 3, content: "1号我不是不相信你，只是我们当中可能有奸徒的存在，我要多观察你们才能保证团队的安全，我是受害者我要逃出这里！"}]],
    [1, ['update', {"round":2,"stage":"speak","room":6,"player":0,"time":80,"bomb":1}]],
    [5, ['think', "刚才3号看了我的线索卡为什么不说出来确定呢? 3号非常可疑呀! 可是他的发言回合已经结束了，只能下回合提醒他了。"]],
    [6, ['speak', {player: 6, content: "这回合我可以配合大家拆弹，但如果2号和1号都不去解锁的话那我会去7号房间解锁，毕竟线索获得是最重要的事情。"}]],
    // R2 move
    [3, ['update', {"round":2,"stage":"move","room":null,"player":null,"time":3,"bomb":1}]],
    [3, ['move', {player: 4, movements: [{to: 3}, {to: 4}]}]],
    [3, ['move', {player: 5, movements: [{to: 3}]}]],
    [2, ['move', {player: 2, movements: [{to: 0}, {to: 7, lockAction: 'unlock'}]}]],
    [4, ['think', "2号利用移动顺序的时间差帮我解开了7号房间！我可以去8号房间解毒了!"]],
    [3, ['move', {player: 1, movements: [{to: 7}, {to: 8, lockAction: 'unlock'}]}]],
    [2, ['move', {player: 3, movements: [{to: 6}, {to: 0}]}]],
    [4, ['think', "为什么3号不去拆弹房间？如果他去6号拆弹房间就可以跟5号玩家合力拆弹增加逃走的时间！"]],
    [3, ['move', {player: 6, movements: [{to: 9}]}]],
    // R3 time
    [3, ['update', {"round":3,"stage":"time","room":null,"player":null,"time":3,"bomb":1}]],
    // R3 perform
    [3, ['update', {"round":3,"stage":"perform","room":null,"player":null,"time":3,"bomb":1}]],
    [5, ['skip', {player: 5, reason: 'no-enough-player'}]],
    [5, ['think', "唯一能与5号配合拆弹的方案就是3号去6号房间，但是他没去，导致5号白白浪费行动力！"]],
    [1, ['update', {"round":3,"stage":"perform","room":4,"player":0,"time":1,"bomb":1}]],
    [3, ['clue', {player: 4, type: 'gain', clue: {level: 1}}]],
    [1, ['update', {"round":3,"stage":"perform","room":7,"player":0,"time":1,"bomb":1}]],
    [3, ['clue', {player: 2, type: 'gain', clue: {level: 1}}]],
    [1, ['update', {"round":3,"stage":"perform","room":8,"player":0,"time":1,"bomb":1}]],
    [3, ['detoxify', {player: 1}]],
    [1, ['update', {"round":3,"stage":"perform","room":9,"player":0,"time":15,"bomb":1}]],
    [5, ['challenge', {question: 'watch', player: 6, time: 15}]],
    [3, ['clue', {type: 'watch', player: 6, target: 2}]],
    // R3 thinking
    [15, ['update', {"round":3,"stage":"thinking","room":null,"player":null,"time":15,"bomb":1}]],
    // R3 speak
    [3, ['update', {"round":3,"stage":"speak","room":null,"player":null,"time":3,"bomb":1}]],
    [1, ['update', {"round":3,"stage":"speak","room":0,"player":0,"time":90,"bomb":1}]],
    [3, ['speak', {player: 3, content: "我刚才忘了说1号玩家手上的线索卡, 3号房间的确是危险的。"}]],
    [4, ['speak', {player: 3, content: "我想快点跑回大厅告诉大家这个消息，没想到刚才错过了拆弹的时机。"}]],
    [1, ['update', {"round":3,"stage":"speak","room":3,"player":0,"time":90,"bomb":1}]],
    [3, ['speak', {player: 5, content: "3号应该就是奸徒了，大家小心点吧，我的行动都被浪费了！"}]],
    [3, ['think', "对，3号肯定就是奸徒了！"]],
    [1, ['update', {"round":3,"stage":"speak","room":4,"player":0,"time":90,"bomb":1}]],
    [3, ['speak', {player: 4, content: "我刚才获得的线索卡是9号房间是最终危险的！"}]],
    [10, ['notice', "你可以点击地图上方的线索区【9】号房间的位置，将其标记为【?】表示该房间可能是危险的，因为其他玩家的话不一定是真实的。"]],
    [6, ['speak', {player: 4, content: "3号的确有可疑，这回合我觉得应该给一个机会3号，让他和我们配合拆弹，这样子就可以证明自己了。"}]],
    [1, ['update', {"round":3,"stage":"speak","room":7,"player":0,"time":90,"bomb":1}]],
    [3, ['speak', {player: 2, content: "我刚才获得的线索卡是2号房间是最终危险的！"}]],
    [10, ['notice', "你可以点击地图上方的线索区【2】号房间的位置将其标记为【?】。"]],
    [8, ['speak', {player: 2, content: "我想我这回合需要去解毒，另外刚才6号玩家已经监控了我手上的线索，请一会儿在发言的时候确定！不然我们就会当你是另外一个嫌疑人！"}]],
    [1, ['update', {"round":3,"stage":"speak","room":8,"player":0,"time":90,"bomb":1}]],
    [8, ['speak', {player: 1, content: "我们对于谁是奸徒已经大概了解了，接下来再来一次拆弹我们的时间就更多了,我这回合为了不打扰大家的安排，我想我会回到大厅待机。"}]],
    [1, ['update', {"round":3,"stage":"speak","room":9,"player":0,"time":90,"bomb":1}]],
    [8, ['speak', {player: 6, content: "我刚才监控了2号的卡，他应该是一个好人吧。关于这回合的拆弹我有我自己的想法，大家移动的时候我再表态！"}]],
    [5, ['think', "6号怎么不说监控结果，2号玩家的线索到底是不是真的呢？"]],
    [10, ['think', "另外，6号会配合大家拆弹吗? 如果3号去破坏的话那6号就会浪费行动力了,还有一个房间未解锁,他应该去解锁同时解毒会比较好,我刚才应该多说几句指明情况的，只可惜不能再发言了!"]],
    // R3 move
    [3, ['update', {"round":3,"stage":"move","room":null,"player":null,"time":3,"bomb":1}]],
    [3, ['move', {player: 3, movements: [{to: 3}]}]],
    [3, ['move', {player: 5, movements: [{to: 0}, {to: 7}]}]],
    [3, ['move', {player: 4, movements: [{to: 3}]}]],
    [3, ['move', {player: 2, movements: [{to: 8}]}]],
    [3, ['move', {player: 1, movements: [{to: 7}, {to: 0}]}]],
    [3, ['move', {player: 6, movements: [{to: 10}, {to: 11, lockAction: 'unlock'}]}]],
    [10, ['think', "还好6号选择去治疗，如果他移动进了6号拆弹房间那么3号就会破坏掉那我们的行动，时间就浪费了，现在又多一个治疗房间可以使用了，6号做得好呀！"]],
    // R4 time
    [3, ['update', {"round":4,"stage":"time","room":null,"player":null,"time":3,"bomb":1}]],
    // R4 perform
    [3, ['update', {"round":4,"stage":"perform","room":null,"player":null,"time":3,"bomb":1}]],
    [5, ['skip', {player: 3, reason: 'no-enough-player'}]],
    [5, ['think', "这次拆弹的人数又不够，看来我要赶快获得更多的线索才行"]],
    [1, ['update', {"round":4,"stage":"perform","room":7,"player":0,"time":1,"bomb":1}]],
    [3, ['clue', {player: 5, type: 'gain', clue: {level: 1}}]],
    [1, ['update', {"round":4,"stage":"perform","room":8,"player":0,"time":1,"bomb":1}]],
    [3, ['detoxify', {player: 2}]],
    [1, ['update', {"round":4,"stage":"perform","room":11,"player":0,"time":1,"bomb":1}]],
    [3, ['detoxify', {player: 6}]],
    // R4 thinking
    [15, ['update', {"round":4,"stage":"thinking","room":null,"player":null,"time":15,"bomb":1}]],
    // R4 speak
    [3, ['update', {"round":4,"stage":"speak","room":null,"player":null,"time":3,"bomb":1}]],
    [1, ['update', {"round":4,"stage":"speak","room":0,"player":0,"time":100,"bomb":1}]],
    [3, ['speak', {player: 1, content: "这回合我要升级线索卡，能和我配合升级的是..."}]],
    [5, ['speak', {player: 1, content: "4号，你可以和我去升级Lv2线索卡，有1号L升级房间和2号S升级房间都可以去进行升级。"}]],
    [3, ['think', "可以考验下4号的时机来了。"]],
    [5, ['speak', {player: 1, content: "如果到1号L房间则升级后的卡片由4号获得，如果到2号S房间就是小号码的我获得，4号你选一个房间吧。"}]],
    [1, ['update', {"round":4,"stage":"speak","room":3,"player":0,"time":100,"bomb":1}]],
    [1, ['speak', {player: 3, content: "大家忽略我了吗？"}]],
    [3, ['speak', {player: 3, content: "我刚才已经听大家的安排去拆弹房间了，为什么大家不配合我的行动呀？"}]],
    [2, ['speak', {player: 3, content: "现在这样子不是浪费了我和4号的行动力了吗？"}]],
    [1, ['speak', {player: 3, content: "我是无辜的受害者呀！"}]],
    [3, ['speak', {player: 3, content: "现在只有我没有线索卡了，我要到4号线索房间拿线索帮助大家。"}]],
    [1, ['speak', {player: 3, content: "我会用行动证明我是好人！"}]],
    [1, ['update', {"round":4,"stage":"speak","room":3,"player":1,"time":100,"bomb":1}]],
    [4, ['speak', {player: 4, content: "1号我要到1号L升级房间，因为我知道我自己的身份肯定是受害者，线索要拿在自己手上才是最安全的。"}]],
    [8, ['speak', {player: 4, content: "希望你配合我到1号房间升级，升级完成后下一回合你可以到4号房间再拿线索，如果不升级的话你可以考虑去5号房间监控3号的线索，反正你也不信他。"}]],
    [3, ['think', "监控3号固然重要，但现在升级更重要。"]],
    [1, ['update', {"round":4,"stage":"speak","room":7,"player":0,"time":100,"bomb":1}]],
    [2, ['speak', {player: 5, content: "我刚才获得的线索卡是7号房间是最终危险的！"}]],
    [5, ['notice', "你可以将【7】号房间标记为【?】"]],
    [2, ['speak', {player: 5, content: "这回合如果我不解毒就没时间去了,我要去治疗。"}]],
    [4, ['speak', {player: 5, content: "1号你可以去监控一下我的线索卡，不过现在奸徒很明显出来了，除了3号的线索外其它人都基本不需要看了!"}]],
    [1, ['update', {"round":4,"stage":"speak","room":8,"player":0,"time":100,"bomb":1}]],
    [3, ['speak', {player: 2, content: "我回大厅待机，下回合看情况我也要升级线索卡。"}]],
    [1, ['update', {"round":4,"stage":"speak","room":11,"player":0,"time":100,"bomb":1}]],
    [15, ['speak', {player: 6, content: "我是最后一个发言归票的，我先解释一下刚才的行为，我不去拆弹而去解毒的原因很简单，就是我不想3号来破坏行动，大家看看，3号到现在都没有解毒，因为奸徒是不需要解毒的！所以为了保证我自己存活所以我首先选择治疗我自己。刚才上一回合我看到2号手上的Lv1线索的确是2号房间是危险的，大家最后不要到2号房间。"}]],
    [8, ['notice', "【2】号房间被第二位玩家证实是危险的，可以点击线索区，将其标记为【X】，表示确定危险。(游戏中最多只有一个奸徒，不可能两个人同时说谎)"]],
    [5, ['speak', {player: 6, content: "这一回合呢？...我想我会去9号房间看一下3号拿的卡，3号你可不要轻举妄动哦！"}]],
    [3, ['think', "对的！给3号些压力让他乖乖的!"]],
    // R4 move
    [3, ['update', {"round":4,"stage":"move","room":null,"player":null,"time":3,"bomb":1}]],
    [3, ['move', {player: 1, movements: [{to: 3}, {to: 1}]}]],
    [3, ['move', {player: 3, movements: [{to: 4}]}]],
    [3, ['move', {player: 4, movements: [{to: 1}]}]],
    [3, ['move', {player: 5, movements: [{to: 11}]}]],
    [3, ['move', {player: 2, movements: [{to: 7}, {to: 0}]}]],
    [3, ['move', {player: 6, movements: [{to: 7}]}]],
    [3, ['think', "6号不是说去看3号的线索卡吗？"]],
    // R5 time
    [3, ['update', {"round":5,"stage":"time","room":null,"player":null,"time":3,"bomb":1}]],
    // R5 perform
    [3, ['update', {"round":5,"stage":"perform","room":null,"player":null,"time":3,"bomb":1}]],
    [1, ['update', {"round":5,"stage":"perform","room":1,"player":0,"time":1,"bomb":1}]],
    [5, ['notice', "你将和4号升级线索卡，1级+1级 = 2级，升级后你们将失去手中的1级线索卡，升级得到的2级线索卡归4号所有。"]],
    [3, ['think', "线索很重要，我同意配合4号升级！"]],
    //TODO 升级线索卡challenge
    [3, ['action', {type: 'upgrade', result: true, gain: {player: 4, level: 2}, participants: [1, 4]}]],
    [1, ['update', {"round":5,"stage":"perform","room":4,"player":0,"time":1,"bomb":1}]],
    [3, ['clue', {player: 3, type: 'gain', clue: {level: 1}}]],
    [1, ['update', {"round":5,"stage":"perform","room":7,"player":0,"time":1,"bomb":1}]],
    [3, ['clue', {player: 6, type: 'gain', clue: {level: 1}}]],
    [1, ['update', {"round":5,"stage":"perform","room":11,"player":0,"time":1,"bomb":1}]],
    [3, ['detoxify', {player: 5}]],
    // R5 thinking
    [15, ['update', {"round":5,"stage":"thinking","room":null,"player":null,"time":15,"bomb":1}]],
    // R5 speak
    [3, ['update', {"round":5,"stage":"speak","room":null,"player":null,"time":3,"bomb":1}]],
    [1, ['update', {"round":5,"stage":"speak","room":0,"player":0,"time":110,"bomb":1}]],
    [8, ['speak', {player: 2, content: "这回合我可以升级，而且选择比较多，如果和4号去升级的话就会得出Lv3线索卡，如果和3号去升级的话就会得出Lv2线索卡。"}]],
    [5, ['speak', {player: 2, content: "大家都对3号非常怀疑，但我觉得3号这二个回合的表现还好，所以我想听听大家的意见。"}]],
    [5, ['think', "Lv3的线索信息量比Lv2的要高，肯定升级Lv3的好，而且升级Lv2要和3号配合, 2号脑子坏了?"]],
    [1, ['update', {"round":5,"stage":"speak","room":1,"player":0,"time":110,"bomb":1}]],
    [3, ['speak', {player: 4, content: "我刚才获得的Lv2线索卡是【蓝色】房间是最终危险的！"}]],
    [5, ['speak', {player: 4, content: "这样子我们一下子就排除了2号、5号、12号三个蓝色房间，2号房间之前由Lv1线索卡得知是危险房间，现在更进一步肯定了。"}]],
    [5, ['notice', "你可以将【5】号、【12】号房间标记为【?】"]],
    [3, ['speak', {player: 4, content: "这回合我要再去升级Lv3线索卡，2号你和我配合吧！保留对3号的怀疑。"}]],
    [8, ['speak', {player: 4, content: "另外，我建议1号把钥匙给我，一旦最后一回合集中大厅逃生时3号把安全房间锁上，我可以在后手将其打开，这样4 5 6共3人可以逃生。"}]],
    //TODO 索要钥匙challenge
    [3, ['key', {type: 'request', agree: true, player: 1, fromPlayer: 4}]],
    [1, ['update', {"round":5,"stage":"speak","room":1,"player":1,"time":110,"bomb":1}]],
    [1, ['speak', {player: 1, content: "很好！我们现在很接近答案了！"}]],
    [5, ['speak', {player: 1, content: "3号如果你是好人的话一会儿就马上说出你手上的线索卡，如果你不说的话2号就会去5号房间监控你的线索。"}]],
    [3, ['speak', {player: 1, content: "这回合我会到4号房间再拿一张Lv1线索卡的。"}]],
    [1, ['update', {"round":5,"stage":"speak","room":4,"player":0,"time":110,"bomb":1}]],
    [2, ['speak', {player: 3, content: "我刚才获得的Lv1线索卡是5号房间是最终危险的！"}]],
    [5, ['speak', {player: 3, content: "大家要相信我，这回合我可以和大家一起升级Lv2线索卡，如果大家不信我那我只能去解毒了。"}]],
    [8, ['think', "5号房间已经在刚才的Lv2线索卡中排除，3号这张线索卡没有任何用处！不过就算是他谎报的话也是漏掉线索，并没有提供错误的线索，这样子暂时可以先不用监控他。"]],
    [1, ['update', {"round":5,"stage":"speak","room":7,"player":0,"time":110,"bomb":1}]],
    [4, ['speak', {player: 6, content: "3号的卡如果是5号房间就不需要看了，现在更重要的监控Lv3的高级线索卡。"}]],
    [2, ['speak', {player: 6, content: "3号你如果不是奸徒就去解毒吧！"}]],
    [2, ['speak', {player: 6, content: "5号你去看一下升级出来的Lv3线索。"}]],
    [1, ['update', {"round":5,"stage":"speak","room":11,"player":0,"time":110,"bomb":1}]],
    [5, ['speak', {player: 5, content: "没问题，有了Lv3线索我们就很快会知道最后的答案了，我到9号房间去监控一下。"}]],
    // R5 move
    [3, ['update', {"round":5,"stage":"move","room":null,"player":null,"time":3,"bomb":1}]],
    [3, ['move', {player: 2, movements: [{to: 3}, {to: 2}]}]],
    [3, ['move', {player: 4, movements: [{to: 3}, {to: 2}]}]],
    [3, ['move', {player: 1, movements: [{to: 3}, {to: 4}]}]],
    [3, ['move', {player: 3, movements: [{to: 7}, {to: 11}]}]],
    [3, ['move', {player: 6, movements: [{to: 0}]}]],
    [3, ['move', {player: 5, movements: [{to: 10}, {to: 9}]}]],
    // R6 time
    [3, ['update', {"round":6,"stage":"time","room":null,"player":null,"time":3,"bomb":1}]],
    // R6 perform
    [3, ['update', {"round":6,"stage":"perform","room":null,"player":null,"time":3,"bomb":1}]],
    [1, ['update', {"round":6,"stage":"perform","room":2,"player":0,"time":1,"bomb":1}]],
    [6, ['challenge', {participants: [2,4], question: 'action', options: {masterPlayer: 2, actionType: 'upgrade'}, time: 15}]],
    [3, ['action', {type: 'upgrade', result: true, gain: {player: 2, level: 3}, participants: [2, 4]}]],
    [1, ['update', {"round":6,"stage":"perform","room":4,"player":0,"time":1,"bomb":1}]],
    [1, ['clue', {player: 1, type: 'gain', clue: {level: 1}}]],
    [1, ['clue', {type: 'receive', clue: {level: 1, room: 8}}]],
    [1, ['update', {"round":6,"stage":"perform","room":9,"player":0,"time":15,"bomb":1}]],
    [5, ['challenge', {question: 'watch', player: 5, time: 15}]],
    [3, ['clue', {type: 'watch', player: 5, target: 2}]],
    [1, ['update', {"round":6,"stage":"perform","room":11,"player":0,"time":1,"bomb":1}]],
    [3, ['detoxify', {player: 3}]],
    // R6 thinking
    [15, ['update', {"round":6,"stage":"thinking","room":null,"player":null,"time":15,"bomb":1}]],
    // R6 speak
    [3, ['update', {"round":6,"stage":"speak","room":null,"player":null,"time":3,"bomb":1}]],
    [1, ['update', {"round":6,"stage":"speak","room":0,"player":0,"time":120,"bomb":1}]],
    [6, ['speak', {player: 6, content: "我们的升级好了，大家做得好！我要听一下2号的Lv3线索卡内容来决定这最后一次行动的计划。"}]],
    [1, ['update', {"round":6,"stage":"speak","room":2,"player":0,"time":120,"bomb":1}]],
    [3, ['speak', {player: 2, content: "我刚才获得的Lv1线索卡是【无锁】的房间是最终危险的！"}]],
    [3, ['speak', {player: 2, content: "这样子我们一下就排除了3号、4号、6号、9号、10号、12号房间。"}]],
    [3, ['speak', {player: 2, content: "原来的3号、9号是通过Lv1排除，而12号房间是通过Lv2排除。"}]],
    [10, ['notice', "你可以将【3】号、【9】号、【12】号房间标记为【X】，【4】号、【6】号、【10】号房间标记为【?】"]],
    [10, ['speak', {player: 2, content: "通过Lv1和Lv2与Lv3进行线索叠加，我们我们推理得出3号、9号和12号肯定不是最后的安全房间，而一会如果5号证实我手上的Lv3的话那剩余的4号、6号和10号房间都不是最后的安全房间。那么安全房间的可能就剩余8号和11号房间了！"}]],
    [7, ['think', "2号完美的推理呀！我刚才获得的Lv1线索卡的内容就是8号房间是危险的，只要我说出来，那真相就出现了！最后的答案就是11号房间是最终的安全房间！"]],
    [1, ['update', {"round":6,"stage":"speak","room":2,"player":1,"time":120,"bomb":1}]],
    [8, ['speak', {player: 4, content: "咳！咳！我没有解毒，看来我要死在这里了，我为团队做的贡献大家要记住，剩余8号和11号房间，我想我临死之前再去4号房间拿一张线索卡好了。"}]],
    [1, ['update', {"round":6,"stage":"speak","room":4,"player":0,"time":120,"bomb":1}]],
    [3, ['think', "终于轮到我发言了，谜底即将揭开，我们将要逃出这可恶的密室！"]],
    [5, ['speak', {player: 1, content: "我刚才获得的Lv1线索卡是8号房间是最终危险的！也就是说11号房间就是最终的出口！"}]],
    [2, ['speak', {player: 1, content: "现在大家集中到大厅然后逃走吧！"}]],
    [1, ['speak', {player: 1, content: "天堂的出口就是眼前！"}]],
    [1, ['speak', {player: 1, content: "11号房间是安全出口！"}]],
    [1, ['speak', {player: 1, content: "11号房间是安全出口！"}]],
    [1, ['update', {"round":6,"stage":"speak","room":9,"player":0,"time":120,"bomb":1}]],
    [5, ['speak', {player: 5, content: "想不到答案这么快就出现了，2号的线索卡的确是【无锁】危险。"}]],
    [5, ['notice', "你可以将【4】号、【6】号、【10】号房间标记为【X】"]],
    [5, ['speak', {player: 5, content: "但我们现在还有3张线索没有监控到，而且贡献最大的4号还没有解毒。。。"}]],
    [5, ['speak', {player: 5, content: "对了，我们可以再次拆弹，这样子我们就有足够的时间监控和解毒了。"}]],
    [8, ['speak', {player: 5, content: "3号奸徒距离不够不能来破坏拆弹了，建议1号和6号跟我一起拆弹，2，3负责监控，4号先去拿张线索卡，等我们拆弹成功就有时间解毒了"}]],
    [3, ['speak', {player: 5, content: "这样我们大家都能逃走了！"}]],
    [1, ['update', {"round":6,"stage":"speak","room":11,"player":0,"time":120,"bomb":1}]],
    [5, ['speak', {player: 3, content: "这计划好是好，但是如果失败了，大家就都逃不掉了，大家还是回大厅集中然后逃走吧！我是受害者！"}]],
    [3, ['think', "5号的方案非常好，3号你这次破坏不了了！"]],
    // R6 move
    [3, ['update', {"round":6,"stage":"move","room":null,"player":null,"time":3,"bomb":1}]],
    [3, ['move', {player: 6, movements: [{to: 3}]}]],
    [3, ['move', {player: 2, movements: [{to: 6}, {to: 5}]}]],
    [3, ['move', {player: 4, movements: [{to: 3}, {to: 4}]}]],
    [3, ['move', {player: 1, movements: [{to: 3}]}]],
    [8, ['think', "这次3号不能再破坏我们的拆弹了，只要再拆1次我们就有多1个回合的逃生时间，这样子我们全部都可以去到安全房间逃生了！"]],
    [3, ['move', {player: 5, movements: [{to: 6}]}]],
    [3, ['move', {player: 3, movements: [{to: 10}, {to: 9}]}]],
    // R7 time
    [3, ['update', {"round":7,"stage":"time","room":null,"player":null,"time":3,"bomb":1}]],
    // R7 perform
    [3, ['update', {"round":7,"stage":"perform","room":null,"player":null,"time":3,"bomb":1}]],
    [1, ['update', {"round":7,"stage":"perform","room":3,"player":0,"time":1,"bomb":1}]],
    [6, ['challenge', {participants: [1,5,6], question: 'action', options: {masterPlayer: 1, actionType: 'disarm'}, time: 15}]],
    [3, ['think', "拆弹肯定会成功的！"]],
    [3, ['action', {type: 'disarm', result: false, bomb: -2}]],
    [5, ['think', "天呐！拆弹居然失败了！奸徒就在5号和6号之中！没时间了！我们没时间到达安全房间了！！！"]],
    [1, ['update', {"round":7,"stage":"perform","room":4,"player":0,"time":1,"bomb":-2}]],
    [3, ['clue', {player: 4, type: 'gain', clue: {level: 1}}]],
    [1, ['update', {"round":7,"stage":"perform","room":5,"player":0,"time":15,"bomb":-2}]],
    [5, ['challenge', {question: 'watch', player: 2, time: 15}]],
    [3, ['clue', {type: 'watch', player: 2, target: 5}]],
    [3, ['skip', {player: 5, reason: 'second-disarm-room'}]],
    [1, ['update', {"round":7,"stage":"perform","room":9,"player":0,"time":15,"bomb":-2}]],
    [5, ['challenge', {question: 'watch', player: 3, time: 15}]],
    [3, ['clue', {type: 'watch', player: 3, target: 6}]],
    // R7 thinking
    [15, ['update', {"round":7,"stage":"thinking","room":null,"player":null,"time":15,"bomb":-2}]],
    // R6 speak
    [3, ['update', {"round":7,"stage":"speak","room":null,"player":null,"time":3,"bomb":-2}]],
    [1, ['update', {"round":7,"stage":"speak","room":3,"player":0,"time":130,"bomb":-2}]],
    [5, ['speak', {player: 1, content: "天呐！拆弹居然失败了！5号！6号！奸徒就在你们两个当中！到底是谁？"}]],
    [5, ['speak', {player: 1, content: "现在除了3号能到达11号安全房间外，其它人都要死在这里了！3号居然是受害者！"}]],
    [3, ['think', "思想一片混乱..."]],
    [1, ['update', {"round":7,"stage":"speak","room":3,"player":1,"time":130,"bomb":-2}]],
    [6, ['speak', {player: 6, content: "我是受害者，我们都被骗过来拆弹了！好后悔刚才没有听3号的话回大厅集中，现在我们都要死在这里了！"}]],
    [1, ['update', {"round":7,"stage":"speak","room":4,"player":0,"time":130,"bomb":-2}]],
    [2, ['speak', {player: 4, content: "咳咳，大家都中了调虎离山之计？"}]],
    [3, ['speak', {player: 4, content: "我刚才获得的Lv1线索卡是13号房间是最终危险的！"}]],
    [5, ['notice', "密室中没有【13】号房间，不过“【13】号房间危险”这张线索卡在6人+局中是有的，用来迷惑以增加难度。"]],
    [7, ['speak', {player: 4, content: "这个密室里那里有13号房间呀？13号房间在那里呀？！会是出口吗？抽到这个线索卡难道是团队覆灭的暗示吗？"}]],
    [1, ['update', {"round":7,"stage":"speak","room":5,"player":0,"time":130,"bomb":-2}]],
    [5, ['speak', {player: 2, content: "我刚才看了5号的线索卡，他手上的确是7号房间是危险的...，但我们已经无力回天了..."}]],
    [1, ['update', {"round":7,"stage":"speak","room":6,"player":0,"time":130,"bomb":-2}]],
    [5, ['speak', {player: 5, content: "奸徒是1号，他一直在误导我们进行错误的行动，还冤枉3号是奸徒，我看他自己就是奸徒！"}]],
    [10, ['think', "奸徒是5号！可惜我们互相质疑耽误了时间，密室的目标在于找出安全房间，找到奸徒我们如果不能逃生的话又有什么意义呢？如果当时能再认真想一下的话现在的局面就不会这样子了!"]],
    [5, ['speak', {player: 5, content: "他手上的Lv1线索卡指向8号房间，是唯一没有验证过的，8号房间才是安全房间，可惜呀~我们都不去了啦！"}]],
    [1, ['update', {"round":7,"stage":"speak","room":9,"player":0,"time":130,"bomb":-2}]],
    [3, ['speak', {player: 3, content: "错过了刚才最佳的移动时机，机会走了就不会再有了！"}]],
    [8, ['speak', {player: 3, content: "开始时我的移动是有些混乱，但我在后面可是全力配合大家的，但你们就是没人配合我导致行动力浪费，没有进行完全的团队合作就是我们失败的地方！"}]],
    [4, ['speak', {player: 3, content: "现在只有我一个人能活着，但我们受害者团队失败了！"}]],
    [3, ['think', "哎..."]],
    // R7 move
    [3, ['update', {"round":7,"stage":"move","room":null,"player":null,"time":3,"bomb":-2}]],
    [5, ['notice', "最后一次移动了，本次移动之后将直接进入逃生状态，不再执行任何房间功能！"]],
    [3, ['move', {player: 1, movements: [{to: 0}, {to: 7}]}]],
    [5, ['think', "如果我们在第六回合的时候认真思考现在就不会导致团队灭亡了..., 只差一步我就到出口了... "]],
    [3, ['move', {player: 6, movements: [{to: 0}]}]],
    [3, ['move', {player: 4, movements: [{to: 7}, {to: 11}]}]],
    [3, ['move', {player: 2, movements: [{}]}]],
    [5, ['notice', "逃生前一回合，允许无条件停留在任意房间。"]],
    [3, ['move', {player: 5, movements: [{to: 0}, {to: 10}]}]],
    [3, ['move', {player: 3, movements: [{to: 10}, {to: 11}]}]],
    // R8 time
    [3, ['update', {"round":8,"stage":"time","room":null,"player":null,"time":3,"bomb":-2}]],
    [3, ['over', {
        winner: 'traitor',
        safeRoom: 11,
        players: [
            {id:1, inSafeRoom: false, detoxified: true, role: 'victim'},
            {id:2, inSafeRoom: false, detoxified: true, role: 'victim'},
            {id:3, inSafeRoom: true, detoxified: true, role: 'victim'},
            {id:4, inSafeRoom: true, detoxified: false, role: 'victim'},
            {id:5, inSafeRoom: false, detoxified: true, role: 'traitor'},
            {id:6, inSafeRoom: false, detoxified: true, role: 'victim'}
        ]
    }]],

    [3, ['none']]
];
var startTutorial = function() {
    socket.mockEvent('start', {
        "testMode": false,
        "rooms": [
            {"id":0,"function":"hall","rule":"small","color":"black","locked":false,"hasLock":false,"hasKey":false,"dangerous":"confirmed","players":[1,2,3,4,5,6]},
            {"id":1,"function":"upgrade","rule":"large","color":"red","locked":false,"hasLock":true,"hasKey":false,"dangerous":"unknown","players":[]},
            {"id":2,"function":"upgrade","rule":"small","color":"blue","locked":false,"hasLock":true,"hasKey":false,"dangerous":"unknown","players":[]},
            {"id":3,"function":"disarm","rule":"small","color":"red","locked":false,"hasLock":false,"hasKey":true,"dangerous":"unknown","players":[]},
            {"id":4,"function":"clue","rule":"small","color":"yellow","locked":false,"hasLock":false,"hasKey":true,"dangerous":"unknown","players":[]},
            {"id":5,"function":"watch","rule":"small","color":"blue","locked":false,"hasLock":true,"hasKey":false,"dangerous":"unknown","players":[]},
            {"id":6,"function":"disarm","rule":"large","color":"green","locked":false,"hasLock":false,"hasKey":true,"dangerous":"unknown","players":[]},
            {"id":7,"function":"clue","rule":"large","color":"green","locked":true,"hasLock":true,"hasKey":false,"dangerous":"unknown","players":[]},
            {"id":8,"function":"detoxify","rule":"small","color":"yellow","locked":true,"hasLock":true,"hasKey":false,"dangerous":"unknown","players":[]},
            {"id":9,"function":"watch","rule":"large","color":"red","locked":false,"hasLock":false,"hasKey":false,"dangerous":"unknown","players":[]},
            {"id":10,"function":"downgrade","rule":"small","color":"green","locked":false,"hasLock":false,"hasKey":false,"dangerous":"unknown","players":[]},
            {"id":11,"function":"detoxify","rule":"large","color":"yellow","locked":true,"hasLock":true,"hasKey":false,"dangerous":"unknown","players":[]},
            {"id":12,"function":"downgrade","rule":"large","color":"blue","locked":false,"hasLock":false,"hasKey":false,"dangerous":"unknown","players":[]}
        ],
        "players": [
            {"id":1,"name":socket.name,"hasKey":false,"injured":true,"role":"victim","room":0},
            {"id":2,"name":"司机","hasKey":false,"injured":true,"role":"unknown","room":0},
            {"id":3,"name":"演员","hasKey":false,"injured":true,"role":"unknown","room":0},
            {"id":4,"name":"商人","hasKey":false,"injured":true,"role":"unknown","room":0},
            {"id":5,"name":"医生","hasKey":false,"injured":true,"role":"unknown","room":0},
            {"id":6,"name":"律师","hasKey":false,"injured":true,"role":"unknown","room":0}
        ],
        "playerId": 1,
        "clueCounts": [12,3,1]
    });
    var i = 0, script = scripts[i];
    var delay = 3, event = script[1];
    var timer = 0;
    var interval = setInterval(function(){
        if(++timer < delay) return;
        timer = 0;
        socket.mockEvent.apply(socket, event);
        delay = script[0];
        if(i == scripts.length - 1) {
            clearInterval(interval);
        } else {
            script = scripts[++i];
            event = script[1];
        }
    }, 1000);
};