from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # 1. Title and Introduction
        title = Text("The Power Rule", font_size=45, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # 2. Creating the initial expression: x^n
        # Using separate Text objects for base and exponent for independent movement
        base_x = Text("x", font_size=100)
        pwr_n = Text("n", font_size=60, color=YELLOW)
        
        # Position exponent relative to base
        pwr_n.next_to(base_x, UP + RIGHT, buff=0.05)
        
        # Group and center the initial expression
        expr = VGroup(base_x, pwr_n)
        expr.move_to([0, 0, 0])
        
        self.play(FadeIn(expr))
        self.wait(1)

        # 3. Visual Metaphor: Arrow showing the 'n' dropping to the front
        # Using fixed coordinates for the arrow to avoid forbidden get_center methods
        # n is roughly at [0.5, 0.5, 0], we want to move to roughly [-1, 0, 0]
        motion_arrow = Arrow(start=[0.5, 0.5, 0], end=[-1.2, 0, 0], color=ORANGE)
        self.play(Create(motion_arrow))
        self.wait(0.5)

        # 4. The Transformation
        # Define the resulting parts
        n_front = Text("n", font_size=100, color=YELLOW)
        n_front.next_to(base_x, LEFT, buff=0.2)
        
        pwr_minus_1 = Text("n - 1", font_size=50, color=GREEN)
        pwr_minus_1.next_to(base_x, UP + RIGHT, buff=0.05)
        
        deriv_symbol = Text("d/dx", font_size=40, color=RED)
        deriv_symbol.shift(LEFT * 3.5)

        # Execute dynamic morphing
        self.play(
            ReplacementTransform(pwr_n.copy(), n_front),
            ReplacementTransform(pwr_n, pwr_minus_1),
            Write(deriv_symbol),
            FadeOut(motion_arrow)
        )
        self.wait(1)

        # 5. Visual Summary and Highlight
        # Create a rectangle to frame the result
        result_box = Rectangle(color=PURPLE, height=2.5, width=6)
        result_box.move_to([0.5, 0, 0])
        
        summary_text = Text("Power becomes coefficient; exponent - 1", font_size=28, color=GREY)
        summary_text.to_edge(DOWN)
        
        self.play(Create(result_box))
        self.play(Write(summary_text))
        self.wait(2)

        # 6. Outro - Fade out all elements
        self.play(
            FadeOut(title),
            FadeOut(base_x),
            FadeOut(n_front),
            FadeOut(pwr_minus_1),
            FadeOut(deriv_symbol),
            FadeOut(result_box),
            FadeOut(summary_text)
        )
        self.wait(0.5)