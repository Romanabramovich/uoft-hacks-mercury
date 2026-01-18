from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # 1. Title and Introduction
        title = Text("The Power Rule", color=BLUE, font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # 2. Setup the expression x^n
        # Using separate Text objects for base and exponent for independent animation
        base = Text("x", font_size=100)
        exponent = Text("n", font_size=70, color=YELLOW)
        exponent.next_to(base, UR, buff=0.1)
        
        # Center the combined expression
        power_expr = VGroup(base, exponent).center()
        
        self.play(FadeIn(power_expr))
        self.wait(1)

        # 3. Visual Communication: Show 'n' moving to the front
        # Arrow indicates the flow of the power rule
        target_pos = base.get_left() + LEFT * 0.8
        flow_arrow = Arrow(
            start=exponent.get_center(), 
            end=target_pos, 
            color=ORANGE, 
            buff=0.2
        )
        
        self.play(Create(flow_arrow))
        self.wait(0.5)

        # 4. Transformation
        # Create the new elements of the derivative
        n_front = Text("n", font_size=100, color=YELLOW)
        n_front.next_to(base, LEFT, buff=0.2)
        
        new_exponent = Text("n-1", font_size=60, color=YELLOW)
        new_exponent.next_to(base, UR, buff=0.1)

        # Execute the morphing
        self.play(
            ReplacementTransform(exponent.copy(), n_front),
            ReplacementTransform(exponent, new_exponent),
            FadeOut(flow_arrow),
            run_time=1.5
        )
        self.wait(1)

        # 5. Visual Highlight: Emphasize the result
        # Group the final result to frame it
        final_result = VGroup(n_front, base, new_exponent)
        highlight_box = Rectangle(
            color=GREEN, 
            height=final_result.get_height() + 0.5, 
            width=final_result.get_width() + 0.5
        )
        highlight_box.move_to(final_result.get_center())
        
        result_label = Text("Derivative", color=GREEN, font_size=32)
        result_label.next_to(highlight_box, DOWN)

        self.play(
            Create(highlight_box),
            Write(result_label)
        )
        self.wait(2)

        # 6. Fade Out
        self.play(
            FadeOut(title),
            FadeOut(final_result),
            FadeOut(highlight_box),
            FadeOut(result_label)
        )
        self.wait(0.5)