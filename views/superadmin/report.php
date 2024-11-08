<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- favicon -->
    <link rel="shortcut icon" type="image/x-icon" href="images/favcon-iconr.png">
    <title>Merchant Report || <?php echo $_SESSION['title']; ?></title>

    <!-- Google Font: Source Sans Pro -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
  
    <!-- Font Awesome -->
    <link rel="stylesheet" href="plugins/fontawesome-free/css/all.min.css">
  
    <!-- Theme style -->
    <link rel="stylesheet" href="dist/css/adminlte.min.css">
    
    <!-- DataTables -->
    <link rel="stylesheet" href="plugins/datatables-bs4/css/dataTables.bootstrap4.min.css">
    <link rel="stylesheet" href="plugins/datatables-responsive/css/responsive.bootstrap4.min.css">
    <link rel="stylesheet" href="plugins/datatables-buttons/css/buttons.bootstrap4.min.css">

</head>
<style>
#dd dl {display: inline;margin-right: 7px;font-size: 18px;color: #dc3545;padding: 0 19px 0 19px;} 
</style>
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
                        <h1>Report</h1>
                    </div>
                    <div class="col-sm-6">
                        <ol class="breadcrumb float-sm-right">
                            <li class="breadcrumb-item"><a href="#">Dashboard</a></li>
                            <li class="breadcrumb-item active">Report</li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>

        <section class="content">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Search by date ...</h3>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-1"></div>
                                    <div class="col-md-10">
                                        <dd id="dd" style="margin-bottom: 14px;">
                                            <span>
                    							<a style="cursor:pointer" onClick="return todayDate('dp4','dp5');"><dl> Today </dl></a>
                    							<a style="cursor:pointer" onClick="return yesterdayDate('dFDate','dTDate');"><dl>Yesterday </dl></a>
                    							<a style="cursor:pointer" onClick="return currentweekDate('dFDate','dTDate');"><dl>Current Week </dl></a>
                    							<a style="cursor:pointer" onClick="return previousweekDate('dFDate','dTDate');"><dl>Previous Week </dl></a>
                    							<a style="cursor:pointer" onClick="return currentmonthDate('dFDate','dTDate');"><dl>Current Month </dl></a>
                    							<a style="cursor:pointer" onClick="return previousmonthDate('dFDate','dTDate');"><dl style="border-right: 0px solid;">Previous Month </dl></a>
                    							<!--<a style="cursor:pointer" onClick="return currentyearDate('dFDate','dTDate');"><dl>Current Year |</dl></a>
                    							<a style="cursor:pointer" onClick="return previousyearDate('dFDate','dTDate');"><dl>Previous Year |</dl></a>-->
        					                </span> 
                                        </dd>
                                    </div>
                                    <div class="col-md-1"></div>
                                </div>
                                
                                <form method="post">
                                    <div class="row" style="border-top: 1px solid #8080803b;padding: 15px 0 15px 0px;">
                                        <div class="col-md-1">
                                            <b>From </b>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="form-group">
                                                <input type="text" id="dp4" name="startDate" placeholder="From Date" class="form-control" autocomplete="off" style="cursor:default; background-color: #fff" readonly>
                                            </div>
                                        </div>
                                        <div class="col-md-1">
                                            <b>To </b>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="form-group">
                                                <input type="text" id="dp5" name="endDate" placeholder="To Date" class="form-control" autocomplete="off"  style="cursor:default; background-color: #fff" readonly/>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-group">
                                                <center>
                                                    <button type="submit" name="search" class="btn btn-danger">SEARCH</button>
                                                    <button type="button" class="btn btn-info" onclick="this.form.reset();">Reset</button>
                                                </center>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div> 
                        
                        <!-- Main content -->
                        <div class="invoice p-3 mb-3">
                            <div class="row">
                                <div class="col-12 table-responsive">
                                    <table id="example2" class="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th>Sr. No.</th>
                                                <th>TRN</th>
                                                <th>First Name</th>
                                                <th>Last Name</th>
                                                <th>Mobile Number</th>
                                                <th>Email Address</th>
                                                <th>Agent/Freight Forwarder</th>
                                                <th>Individual Making Appointment</th>
                                                <th>Appointment Type</th>
                                                <th>Vessel Name</th>
                                                <th>Vessel Reported Date </th>
                                                <th>Bill of Lading Number</th>
                                                <th>Chassis No </th>
                                                <th>IMS4 Declaration Number</th>
                                                <th>Container Number</th>
                                                <th>Number of Pieces/Packages</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>1</td>
                                                <td>abc</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td>None</td>
                                                <td><span class="badge badge-danger"> Inactive </span></td>
                                                <td> 
                                                    <a href="#" class="btn btn-outline-primary btn-sm" style="margin: 3px;"><i class="fa fa-edit"></i> Rescheduled </a>
                                                    <a href="#" class="btn btn-outline-danger btn-sm" style="margin: 3px;"><i class="fa fa-trash"></i> Canceled </a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
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

<!-- DataTables  & Plugins -->
<script src="plugins/datatables/jquery.dataTables.min.js"></script>
<script src="plugins/datatables-bs4/js/dataTables.bootstrap4.min.js"></script>
<script src="plugins/datatables-responsive/js/dataTables.responsive.min.js"></script>
<script src="plugins/datatables-responsive/js/responsive.bootstrap4.min.js"></script>
<script src="plugins/datatables-buttons/js/dataTables.buttons.min.js"></script>
<script src="plugins/datatables-buttons/js/buttons.bootstrap4.min.js"></script>

<!-- jQuery -->
<script src="plugins/jquery/jquery.min.js"></script>

<!-- Bootstrap 4 -->
<script src="plugins/bootstrap/js/bootstrap.bundle.min.js"></script>

<!-- AdminLTE App -->
<script src="dist/js/adminlte.min.js"></script>

<!-- AdminLTE for demo purposes -->
<script src="dist/js/demo.js"></script>

<!-- Date Related Links --->
<script type="text/javascript" src="//cdn.jsdelivr.net/jquery/1/jquery.min.js"></script>
<script type="text/javascript" src="//cdn.jsdelivr.net/momentjs/latest/moment.min.js"></script>

<!-- Page specific script -->
<script>
  $(function () {
    $("#example1").DataTable({
      "responsive": true, "lengthChange": false, "autoWidth": false,"paging": false,"searching": true,
      "buttons": ["copy", "csv", "excel", "pdf", "print", "colvis"]
      /*"buttons": ["pdf", "print", "colvis"]*/
    }).buttons().container().appendTo('#example1_wrapper .col-md-6:eq(0)');
    $('#example2').DataTable({
      "paging": false,
      "lengthChange": false,
      "searching": false,
      "ordering": true,
      "info": true,
      "autoWidth": false,
      "responsive": true,
    });
  });
</script>

<script>
$('#dp4').datepicker()
    .on('changeDate', function (ev) {
    var endDate = $('#dp5').val();
    if (ev.date.valueOf() < endDate.valueOf()) {
        $('#alert').show().find('strong').text('The start date can not be greater then the end date');
    } else {
        $('#alert').hide();
        var startDate = new Date(ev.date);
        $('#startDate').text($('#dp4').data('date'));
    }
    $('#dp4').datepicker('hide');
});
$('#dp5').datepicker()
.on('changeDate', function (ev) {
    var startDate = $('#dp4').val();
    if (ev.date.valueOf() < startDate.valueOf()) {
        $('#alert').show().find('strong').text('The end date can not be less then the start date');
    } else {
        $('#alert').hide();
        var endDate = new Date(ev.date);
        $('#endDate').text($('#dp5').data('date'));
    }
    $('#dp5').datepicker('hide');
});

$(document).ready(function () {
    $("#dp5").click(function(){
         $('#dp5').datepicker('show');
         $('#dp4').datepicker('hide');
    });

    $("#dp4").click(function(){
         $('#dp4').datepicker('show');
         $('#dp5').datepicker('hide');
    });

    if ('' != '') {
        $("#dp4").val('');
        $("#dp4").datepicker('update', '');
    }
    if ('' != '') {
        $("#dp5").datepicker('update', '');
        $("#dp5").val('');
    }
});
$(window).ready(function() {
    $("body").addClass("sidebar-minize");
    $("body").addClass("sidebar_hide");
    $("body").addClass("sidebar-collapse");
});

function setRideStatus(actionStatus) {
    window.location.href = "trip.php?type=" + actionStatus;
}
function todayDate() {
    $("#dp4").val(moment().format('DD-MM-YYYY'));
    $("#dp5").val(moment().format('DD-MM-YYYY'));
}
function reset() {
    location.reload();
}
function yesterdayDate(dt, df)
{
    $("#dp4").val(moment().subtract(1, 'days').format('DD-MM-YYYY'));
    $("#dp5").val(moment().subtract(1, 'days').format('DD-MM-YYYY'));
}
function currentweekDate(dt, df)
{
    $("#dp4").val(moment().startOf('isoWeek').format('DD-MM-YYYY'));
    $("#dp5").val(moment().endOf('isoWeek').format('DD-MM-YYYY'));
}
function previousweekDate(dt, df)
{
     $("#dp4").val(moment().subtract(1, 'weeks').startOf('isoWeek').format('DD-MM-YYYY'));
    $("#dp5").val(moment().subtract(1, 'weeks').endOf('isoWeek').format('DD-MM-YYYY'));
}
function currentmonthDate(dt, df)
{
    $("#dp4").val(moment().startOf('month').format('DD-MM-YYYY'));
    $("#dp5").val(moment().endOf('month').format('DD-MM-YYYY'));
}
function previousmonthDate(dt, df)
{
     $("#dp4").val(moment().subtract(1, 'months').startOf('month').format('DD-MM-YYYY'));
    $("#dp5").val(moment().subtract(1, 'months').endOf('month').format('DD-MM-YYYY'));
}
function currentyearDate(dt, df)
{
    $("#dp4").val(moment().startOf('year').format('DD-MM-YYYY'));
    $("#dp5").val(moment().endOf('year').format('DD-MM-YYYY'));
}
function previousyearDate(dt, df)
{
     $("#dp4").val(moment().subtract(1, 'years').startOf('year').format('DD-MM-YYYY'));
    $("#dp5").val(moment().subtract(1, 'years').endOf('year').format('DD-MM-YYYY'));
}
$("#Search").on('click', function () {
    if ($("#dp5").val() < $("#dp4").val()) {
        alert("From date should be lesser than To date.")
        return false;
    } else {
        var action = $("#_list_form").attr('action');
        var formValus = $("#frmsearch").serialize();
        window.location.href = action + "?" + formValus;
    }
});
$(function () {
    $("select.filter-by-text").each(function () {
        $(this).select2({
            placeholder: $(this).attr('data-text'),
            allowClear: true
        }); //theme: 'classic'
    });
});
$('#searchCompany').change(function() {
    var company_id = $(this).val(); //get the current value's option
    $.ajax({
        type:'POST',
        url:'ajax_find_driver_by_company.php',
        data:{'company_id':company_id},
        cache: false,
        success:function(data){
            $(".driver_container").html(data);
        }
    });
});
</script>

</body>
</html>
