from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # 1. Setup Title
        title = Text("The Power Rule", color=WHITE).to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # 2. Create the components of the power rule: d/dx(x^n)
        # We use simple Text objects for each part to allow individual animation
        d_dx = Text("d/dx (", color=WHITE).scale(1.5)
        base_x = Text("x", color=BLUE).scale(1.8)
        exp_n = Text("n", color=RED).scale(1.2)
        paren_r = Text(")", color=WHITE).scale(1.5)
        
        # Manually position the exponent relative to the base x
        exp_n.next_to(base_x, UR, buff=0.1).shift(DOWN * 0.2)
        
        # Group the function
        func_group = VGroup(base_x, exp_n)
        
        # Position the whole left side of the equation
        left_side = VGroup(d_dx, func_group, paren_r).arrange(RIGHT, buff=0.2).move_to(LEFT * 2)
        
        self.play(Write(left_side))
        self.wait(1)

        # 3. The transformation process
        # Highlight the n moving to the front
        arrow = Arrow(start=exp_n.get_top(), end=exp_n.get_top() + LEFT * 2 + DOWN * 1, color=YELLOW)
        
        equals = Text("=", color=WHITE).scale(1.5).next_to(left_side, RIGHT)
        
        # Result components
        res_n = Text("n", color=RED).scale(1.5).next_to(equals, RIGHT, buff=0.3)
        res_x = Text("x", color=BLUE).scale(1.8).next_to(res_n, RIGHT, buff=0.1)
        res_exp = Text("n - 1", color=YELLOW).scale(0.9).next_to(res_x, UR, buff=0.05).shift(DOWN * 0.1)
        
        # Sequence of animations
        self.play(Write(equals))
        
        # Visual metaphor: n drops down to the front
        self.play(Create(arrow))
        self.play(
            ReplacementTransform(exp_n.copy(), res_n),
            FadeOut(arrow)
        )
        self.wait(0.5)
        
        # Base x stays the same
        self.play(ReplacementTransform(base_x.copy(), res_x))
        
        # Exponent becomes n-1
        self.play(Write(res_exp))
        self.wait(1)

        # 4. Adding a visual highlight
        box = Rectangle(color=GREEN, width=5, height=2).move_to(VGroup(res_n, res_x, res_exp).get_center())
        rule_label = Text("Derivative", color=GREEN).scale(0.6).next_to(box, DOWN)
        
        self.play(Create(box))
        self.play(Write(rule_label))
        self.wait(3)

        # 5. Exit
        self.play(
            FadeOut(left_side),
            FadeOut(equals),
            FadeOut(res_n),
            FadeOut(res_x),
            FadeOut(res_exp),
            FadeOut(box),
            FadeOut(rule_label),
            FadeOut(title)
        )
        self.wait(0.5)