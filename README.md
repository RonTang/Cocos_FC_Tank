# Cocos_Fc_Tank
Powerd by Cocos Creator 3.4.2 and https://github.com/ocfbnj/CocosCreatorTank

1.疫情封在家，学一学Cocos Creator，边学边做，索性就把ocfbnj的老项目移植到Cocos Creator3.4.2。

2.增加了道具坦克以及相关道具功能，比如定时，炸弹，无敌。

3.增加坦克升级逻辑，打铁撸草。（为调试方便，死亡坦克不掉等级，等级高后无法死亡。）

4.优化碰撞逻辑，坦克再多也能跑满60FPS。

5.优化了WASD手感，避免丢失按键事件，玩起来更流畅。

6.修复很多原有bug，比如切换关卡后子弹残留到下一关，切换关卡过程中坦克还能移动开枪，游戏已经Gameover还能继续玩等等。

7.代码风格不统一，但基本不影响阅读。

8.发现bug可以提交pr，也可以提交issue，但我回复肯定不及时，奶爸很忙，请谅解。

9.图像声音资源来自网络，代码MIT，你随便用。

10.游戏运行后效果:

![20220415_1135042022415113671](https://user-images.githubusercontent.com/4351322/163514363-4bdca076-a36f-42a5-ae8f-04f9970af135.gif)

11.还可以进一步优化坦克之间的碰撞算法，比如使用 松散的四叉树 或者 网格分割来优化。优化后性能会有很大提高。

![20220417_10300620224171032391](https://user-images.githubusercontent.com/4351322/163697794-7c704260-69b4-4407-a469-9abd86c94bfe.gif)
