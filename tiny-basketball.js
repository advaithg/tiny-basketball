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
      basketball: new defs.Subdivision_Sphere(4),
      basketball_stripe: new defs.Surface_Of_Revolution(
        20,
        20,
        Vector3.cast([0, 1, 1], [0, 1, -1])
      ),
      ground: new defs.Square(),
      wall: new defs.Square(),
      backboard_hoop: new defs.Torus(),
      backboard: new defs.Square(),
    };

    // Materials
    this.materials = {
      phong: new Material(new defs.Textured_Phong(), {
        color: hex_color("#FFFFFF"),
      }),
      basketball: new Material(new defs.Phong_Shader(), {
        color: hex_color("#F88158"),
      }),
      basketball_stripe: new Material(new defs.Phong_Shader(), {
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

    console.log("Sus");
  }

  make_control_panel() {}

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

    let stripe_matrices = [
      Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(1.02, 1.02, 0.03)),
      Mat4.rotation(Math.PI / 2, 1, 0, 0).times(Mat4.scale(1.02, 1.02, 0.03)),
      Mat4.rotation(Math.PI / 4, 0, 0, 1)
        .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
        .times(Mat4.scale(1.02, 1.02, 0.03)),
      Mat4.rotation(-Math.PI / 4, 0, 0, 1)
        .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
        .times(Mat4.scale(1.02, 1.02, 0.03)),
    ];

    for (let i = 0; i < stripe_matrices.length; i++) {
      this.shapes.basketball_stripe.draw(
        context,
        program_state,
        stripe_matrices[i],
        this.materials.basketball_stripe
      );
    }

    /*
    // WALL
    let wall_transform = Mat4.identity();
    wall_transform = wall_transform.times(Mat4.translation(0, 0, -10));
    wall_transform = wall_transform.times(Mat4.scale(10, 10, 0.1));
    this.shapes.wall.draw(
      context,
      program_state,
      wall_transform,
      this.materials.phong.override({ color: hex_color("#ffffff") })
    );

    // GROUND

    // BACKBOARD
    let backboard_transform = Mat4.identity();
    this.shapes.backboard.draw(
      context,
      program_state,
      backboard_transform,
      this.materials.phong
    );
    */
  }
}
