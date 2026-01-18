from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # 1. Title and Introduction
        title = Text("The Power Rule", font_size=45, color=BLUE)
        self.play(Write(title))
        self.wait(1)
        self.play(FadeOut(title))

        # 2. Initial Setup: x^n
        base = Text("x", font_size=100)
        exponent = Text("n", font_size=65, color=YELLOW)
        exponent.next_to(base, UP + RIGHT, buff=0.1)
        
        # Group and center the expression
        formula = VGroup(base, exponent)
        formula.move_to(ORIGIN)
        
        self.play(Write(formula))
        self.wait(1)

        # 3. Visual Metaphor: The Exponent Moves
        # Arrow indicating the movement of the exponent to the front
        arrow = Arrow(start=UP * 1.5, end=LEFT * 1.5, color=ORANGE)
        arrow.next_to(exponent, UP, buff=0.3)
        self.play(Create(arrow))
        self.wait(0.5)

        # Prepare the target state
        # Shift the x to the right slightly and place n in front
        base_target = Text("x", font_size=100)
        base_target.shift(RIGHT * 0.5)
        
        n_front = Text("n", font_size=100, color=YELLOW)
        n_front.next_to(base_target, LEFT, buff=0.3)
        
        exponent_target = Text("n", font_size=65, color=YELLOW)
        exponent_target.next_to(base_target, UP + RIGHT, buff=0.1)

        # Execute the movement
        self.play(
            Transform(base, base_target),
            Transform(exponent, exponent_target),
            FadeIn(n_front),
            FadeOut(arrow)
        )
        self.wait(0.5)

        # 4. Step 2: Subtracting 1 from the exponent
        # Highlight the subtraction action
        minus_one = Text("- 1", font_size=65, color=RED)
        minus_one.next_to(exponent, RIGHT, buff=0.1)
        
        self.play(Write(minus_one))
        self.wait(0.5)

        # Morph the "n - 1" into its final combined text
        new_exponent = Text("n - 1", font_size=60, color=RED)
        new_exponent.move_to(VGroup(exponent, minus_one))
        
        self.play(
            ReplacementTransform(VGroup(exponent, minus_one), new_exponent)
        )
        self.wait(1)

        # 5. Final Highlight: The result
        final_group = VGroup(n_front, base, new_exponent)
        box = Rectangle(color=GREEN, height=2.5, width=5.5)
        box.move_to(final_group)
        
        label = Text("Power Rule Mastered!", font_size=30, color=GREEN)
        label.next_to(box, DOWN, buff=0.5)
        
        self.play(Create(box), Write(label))
        self.wait(2)

        # Clear the scene
        self.play(FadeOut(final_group), FadeOut(box), FadeOut(label))
        self.wait(1)