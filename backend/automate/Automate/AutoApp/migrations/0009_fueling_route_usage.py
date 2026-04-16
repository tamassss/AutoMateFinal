from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0008_routeusage_arrival_delta_min"),
    ]

    operations = [
        migrations.AddField(
            model_name="fueling",
            name="route_usage",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, to="AutoApp.routeusage"),
        ),
    ]
