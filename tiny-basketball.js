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

const COLORS = {
  black: hex_color("#000000"),
  white: hex_color("#ffffff"),
  red: hex_color("#ff0000"),
};

const PATHS = {
  brick_wall: "assets/brick-wall.jpeg",
  basketball: "assets/basketball.png",
};

const RAD_MAX = Math.PI * 2;
const BACKBOARD = {
  omega: RAD_MAX / 10,
  center: Mat4.translation(0, 6, -8.5),
  max: 4.5,
};

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
      basketball: new defs.Subdivision_Sphere(5),
      ground: new defs.Square(),
      wall1: new defs.Square(),
      wall2: new defs.Square(),
      backboard: new defs.Square(),
      backboard_hoop: new defs.Cylindrical_Tube(3, 15),
      backboard_pole: new defs.Cylindrical_Tube(3, 15),
    };

    this.shapes.wall2.arrays.texture_coord = [];
    this.shapes.wall1.arrays.texture_coord.forEach((x, i) => {
      const next = new Vector(this.shapes.wall1.arrays.texture_coord[i]);
      next.scale_by(11);
      this.shapes.wall2.arrays.texture_coord.push(next);
    });

    // Materials
    this.materials = {
      phong: new Material(new defs.Textured_Phong(), {
        color: COLORS.white,
      }),
      basketball: new Material(new defs.Textured_Phong(), {
        color: COLORS.black,
        ambient: 1,
        texture: new Texture(PATHS.basketball),
      }),
      wall_texture: new Material(new defs.Textured_Phong(), {
        color: COLORS.black,
        ambient: 1,
        texture: new Texture(PATHS.brick_wall),
      }),
      ground_texture: new Material(new defs.Textured_Phong(), {
        color: COLORS.white,
      }),
    };

    /* Other Scene Variables */
    // Camera Direction and Location
    this.initial_camera_location = Mat4.look_at(
      vec3(0, 10, 20),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );
    this.initial_camera_position = Mat4.translation(0, 0, -20);
    // Light Position
    this.light_position = vec4(0, 10, 8, 1);
    // dt
    this.dt = 0;
    // Backboard move flag
    this.backboard_move = true;
    // Object locations
    this.positions = {
      backboard: 0,
    };
    console.log("Sus");
  }

  make_control_panel() {
    /* this.key_triggered_button(
      "Pause backboard",
      ["p"],
      () => (this.backboard_move = !this.backboard_move)
    ); */
  }

  display(context, program_state) {
    if (!context.scratchpad.controls) {
      this.children.push(
        (context.scratchpad.controls = new defs.Movement_Controls())
      );
      // Define the global camera and projection matrices, which are stored in program_state.
      program_state.set_camera(this.initial_camera_position);
    }

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      1,
      100
    );

    program_state.lights = [
      new Light(this.light_position, color(1, 1, 1, 1), 1000),
    ];

    (this.t = program_state.animation_time / 1000),
      (this.dt = program_state.animation_delta_time / 1000);

    // BASKETBALL
    this.draw_basketball(context, program_state);
    // BACKGROUND
    this.draw_background(context, program_state);
    // BACKBOARD
    this.draw_backboard(context, program_state);
  }

  // Draws basketball
  draw_basketball(context, program_state) {
    // BALL
    const ball_location = Mat4.identity()
      .times(Mat4.translation(0, -5, 5))
      .times(Mat4.rotation(Math.PI / 2, 1, 0, 0));
    this.shapes.basketball.draw(
      context,
      program_state,
      ball_location,
      this.materials.basketball
    );
  }

  // Draws background
  draw_background(context, program_state) {
    // WALL
    let wall_transform = Mat4.identity()
      .times(Mat4.translation(0, 0, -10))
      .times(Mat4.scale(14, 10, 0.1));
    this.shapes.wall2.draw(
      context,
      program_state,
      wall_transform,
      this.materials.wall_texture
    );

    // GROUND
    let ground_transform = Mat4.identity();
    ground_transform = ground_transform
      .times(Mat4.translation(0, -10, 0))
      .times(Mat4.scale(14, 1, 14))
      .times(Mat4.rotation((3 * Math.PI) / 2, 1, 0, 0));
    this.shapes.ground.draw(
      context,
      program_state,
      ground_transform,
      this.materials.phong
    );
  }

  // Draws backboard
  draw_backboard(context, program_state) {
    // BACKBOARD
    if (this.backboard_move) {
      this.positions.backboard =
        BACKBOARD.max * Math.sin(this.t * BACKBOARD.omega);
    }
    const backboard_location = Mat4.identity()
      .times(BACKBOARD.center)
      .times(Mat4.scale(2.5, 2, 2))
      .times(Mat4.translation(this.positions.backboard, 0, 0));
    this.shapes.backboard.draw(
      context,
      program_state,
      backboard_location,
      this.materials.phong
    );
    // HOOP/NET
    const hoop_location = backboard_location
      .times(Mat4.scale(0.4, 0.5, 0.5))
      .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
      .times(Mat4.translation(0, 1, 1.5));
    this.shapes.backboard_hoop.draw(
      context,
      program_state,
      hoop_location,
      this.materials.phong.override({ color: COLORS.red })
    );
    // SLIDE POLE
    const pole_location = Mat4.identity()
      .times(BACKBOARD.center)
      .times(Mat4.scale(25, 1, 1))
      .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
      .times(Mat4.translation(1, 0, 0));
    this.shapes.backboard_pole.draw(
      context,
      program_state,
      pole_location,
      this.materials.phong.override({ color: COLORS.red })
    );
  }
}
