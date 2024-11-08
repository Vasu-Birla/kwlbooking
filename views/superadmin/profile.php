<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  
    <!-- favicon -->
    <link rel="shortcut icon" type="image/x-icon" href="images/favcon-iconr.png">
    <title>Profile || <?php echo $_SESSION['title']; ?></title>
    
    <!-- Google Font: Source Sans Pro -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="plugins/fontawesome-free/css/all.min.css">
    
    <!-- Theme style -->
    <link rel="stylesheet" href="dist/css/adminlte.min.css">
</head>
<body class="hold-transition sidebar-mini">
<div class="wrapper">

    <!-- // Header -->
        <?php include('header.php'); ?>
    <!-- // Header -->

    <!-- // Sidebar -->
        <?php include('sidebar.php') ?>
    <!-- // Sidebar -->

    <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
        
        <!-- Content Header (Page header) -->
        <section class="content-header">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col-sm-6">
                        <h1>Profile</h1>
                    </div>
                    <div class="col-sm-6">
                        <ol class="breadcrumb float-sm-right">
                            <li class="breadcrumb-item"><a href="#">Home</a></li>
                            <li class="breadcrumb-item active">User Profile</li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>

        <!-- Main content -->
        <section class="content">
            <div class="container-fluid">
                
                <div class="row">
                    <div class="col-md-3">

                    <!-- Profile Image -->
                    <div class="card card-primary card-outline">
                        <div class="card-body box-profile">
                            <div class="text-center">
                                <img class="profile-user-img img-fluid img-circle" src="images/user-160x160.jpg" alt="User profile picture">
                            </div>
                            <h3 class="profile-username text-center">Admin</h3>
                            <p class="text-muted text-center">Adminstration</p>
                        </div>
                    </div>
                    <!-- Profile Image -->
                </div>
                
                <div class="col-md-9">
                    <div class="card">
                        <div class="card-header p-2">
                            <ul class="nav nav-pills">
                                <li class="nav-item"><a class="nav-link active" href="#timeline" data-toggle="tab">Profile</a></li>
                                <li class="nav-item"><a class="nav-link" href="#settings" data-toggle="tab">Change Password</a></li>
                            </ul>
                        </div>
                        <div class="card-body">
                            <div class="tab-content">
                                
                                <!-- Tab 1 -->
                                <div class="active tab-pane" id="timeline">
                                    <form class="form-horizontal" method="post" enctype="multipart/form-data">
                                        <div class="form-group row">
                                            <label for="inputName" class="col-sm-2 col-form-label">Name</label>
                                            <div class="col-sm-10">
                                                <input type="text" class="form-control" placeholder="Name" name="name" value="" autocomplete="off" required>
                                            </div>
                                        </div>
                                        <div class="form-group row">
                                            <label for="inputUserName" class="col-sm-2 col-form-label">User Name</label>
                                            <div class="col-sm-10">
                                                <input type="text" class="form-control" placeholder="Username" name="username" value="" autocomplete="off" required>
                                            </div>
                                        </div>
                                        <div class="form-group row">
                                            <label for="inputEmail" class="col-sm-2 col-form-label">Email</label>
                                            <div class="col-sm-10">
                                                <input type="email" class="form-control" placeholder="Email" name="email" value="" autocomplete="off" required>
                                            </div>
                                        </div>
                                        <div class="form-group row">
                                            <label for="inputMobileNumber" class="col-sm-2 col-form-label">Mobile Number</label>
                                            <div class="col-sm-10">
                                                <input type="text" class="form-control" placeholder="Mobile Number" name="contact" value="" minlength="10" maxlength="10" onkeypress="if ( isNaN( String.fromCharCode(event.keyCode) )) return false;" autocomplete="off" required>
                                            </div>
                                        </div>
                                        <!--<div class="form-group row">
                                            <label for="inputSkills" class="col-sm-2 col-form-label">User Photo</label>
                                            <div class="col-sm-10">
                                                <input type="file" class="form-control" placeholder="Upload image" name="image">
                                            </div>
                                        </div>-->
                                        <div class="form-group row">
                                            <label for="inputFile" class="col-sm-2 col-form-label">Profile Photo</label>
                                            <div class="col-sm-10">
                                                <div class="custom-file">
                                                    <input type="file" placeholder="Upload image" name="image" class="custom-file-input" id="exampleInputFile">
                                                    <label class="custom-file-label" for="exampleInputFile">Choose file</label>
                                                </div>
                                            </div>
                                        </div>
                                        <!--<div class="form-group row">
                                            <div class="offset-sm-2 col-sm-10">
                                                <div class="checkbox">
                                                    <label>
                                                        <input type="checkbox"> I agree to the <a href="#">terms and conditions</a>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>-->
                                        <div class="form-group row">
                                            <div class="offset-sm-2 col-sm-10">
                                                <input type="submit" name="profile" class="btn btn-danger" value="Update Profile">
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <!-- Tab 1 -->
                                
                                <!-- Tab 2 -->
                                <div class="tab-pane" id="settings">
                                    <form class="form-horizontal" method="post" enctype="multipart/form-data">
                                        <div class="form-group row">
                                            <label for="inputCurrentPassword" class="col-sm-3 col-form-label">Current Password</label>
                                            <div class="col-sm-9">
                                                <input type="password" class="form-control" minlength="5" name="oldpassword" placeholder="******" autocomplete="off" required autofocus>
                                            </div>
                                        </div>
                                        <div class="form-group row">
                                            <label for="inputNewPassword" class="col-sm-3 col-form-label">New Password</label>
                                            <div class="col-sm-9">
                                                <input type="password" class="form-control" id="txtPassword" minlength="5" name="newpassword" placeholder="******" autocomplete="off" required autofocus> 
                                            </div>
                                        </div>
                                        <div class="form-group row">
                                            <label for="inputConfirmPassword" class="col-sm-3 col-form-label">Re-type New Password</label>
                                            <div class="col-sm-9">
                                                <input type="password" class="form-control" id="txtConfirmPassword" minlength="5" name="c_password" placeholder="******" autocomplete="off" required autofocus>
                                            </div>
                                        </div>
                                        <div class="form-group row">
                                            <div class="offset-sm-3 col-sm-9">
                                                <input type="submit" name="password" class="btn btn-danger" value="Change Password" onclick="return Validate()"/>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <!-- Tab 2 -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
  
    <!-- // Footer -->
        <?php include('footer.php'); ?>
    <!-- // Footer -->

    <!-- Control Sidebar -->
    <aside class="control-sidebar control-sidebar-dark">
        <!-- Control sidebar content goes here -->
    </aside>
    <!-- // control-sidebar -->
</div>
<!-- // wrapper -->

<!-- Password Match Link -->
<script type="text/javascript">
      function Validate() {
        var password = document.getElementById("txtPassword").value;
        var confirmPassword = document.getElementById("txtConfirmPassword").value;
        if (password != confirmPassword) {
            alert("Passwords do not match.!!");
            return false;
        }
        return true;
     }
</script>
<!-- Password Match Link -->

<!-- jQuery -->
<script src="plugins/jquery/jquery.min.js"></script>

<!-- Bootstrap 4 -->
<script src="plugins/bootstrap/js/bootstrap.bundle.min.js"></script>

<!-- AdminLTE App -->
<script src="dist/js/adminlte.min.js"></script>

<!-- AdminLTE for demo purposes -->
<script src="dist/js/demo.js"></script>

</body>
</html>
