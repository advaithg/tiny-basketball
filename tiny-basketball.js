import { defs, tiny } from "./examples/common.js";

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
  Texture,
} = tiny;

export class TinyBasketball extends Scene {
  /**
   *  **Base_scene** is a Scene that can be added to any display canvas.
   *  Setup the shapes, materials, camera, and lighting here.
   */
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();

    // Shapes
    this.shapes = {
      basketball: new defs.Subdivision_Sphere(10),
      basketball_stripe: new defs.Torus(1, 30),
      ground: new defs.Square(),
      wall: new defs.Square(),
      backboard_hoop: new defs.Torus(),
      backboard: new defs.Square(),
    };

    // Materials
    this.materials = {
      basketball: new Material(new defs.Textured_Phong(), {
        color: hex_color("#F88158"),
      }),
      basketball_stripe: new Material(new defs.Textured_Phong(), {
        color: hex_color("#000000"),
      }),
    };

    /* Other Scene Variables */
    // Camera location
    this.initial_camera_location = Mat4.look_at(
      vec3(0, 10, 20),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );
  }

  make_control_panel() {
    // TODO: Control panel
  }

  display(context, program_state) {
    if (!context.scratchpad.controls) {
      this.children.push(
        (context.scratchpad.controls = new defs.Movement_Controls())
      );
      // Define the global camera and projection matrices, which are stored in program_state.
      program_state.set_camera(Mat4.translation(0, 0, -8));
    }

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      1,
      100
    );

    const light_position = vec4(10, 10, 10, 1);
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

    this.dt = program_state.animation_delta_time / 1000;

    //
    // BASKETBALL
    //
    let model_transform = Mat4.identity();
    model_transform = model_transform.times(Mat4.scale(1, 1, 1));
    this.shapes.basketball.draw(
      context,
      program_state,
      model_transform,
      this.materials.basketball
    );

    model_transform = Mat4.identity();
    model_transform = model_transform.times(Mat4.scale(1.5, 1.5, 0.1));
    this.shapes.basketball_stripe.draw(
      context,
      program_state,
      model_transform,
      this.materials.basketball_stripe
    );

    model_transform = Mat4.identity();
    model_transform = model_transform.times(
      Mat4.rotation(Math.PI / 2, 0, 1, 0)
    );
    model_transform = model_transform.times(Mat4.scale(1.5, 1.5, 0.1));
    this.shapes.basketball_stripe.draw(
      context,
      program_state,
      model_transform,
      this.materials.basketball_stripe
    );

    // WALL

    // GROUND

    // BACKBOARD
  }
}